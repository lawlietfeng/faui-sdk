import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { ComponentRenderer } from '../SchemaRenderer';
import { FormProvider, useFormContextOptional } from '../context/FormContext';
import { useRendererContext } from '../context/RendererContext';
import type { SubmitOptions, SubmitResult, ValidationResult } from '../types/schema';
import { cloneDataModel } from '../utils/submission';
import type { ComponentProps } from './index';



export const Form: React.FC<ComponentProps<'form'>> = ({ config, componentMap }) => {
  return (
    <FormProvider submitButtonId={config.submitButtonId}>
      <FormContent config={config} componentMap={componentMap} />
    </FormProvider>
  );
};

const FormContent: React.FC<ComponentProps<'form'>> = ({ config, componentMap }) => {
  const formContext = useFormContextOptional();
  const {
    getDataModel,
    onSubmit,
    onValidate,
    registerForm,
    unregisterForm,
  } = useRendererContext();
  const children = config.children ?? [];
  const submittingRef = useRef(false);

  useEffect(() => {
    if (onSubmit && config.submitButtonId) {
      console.warn(
        `[FAUI] Form "${config.id}" configures both onSubmit and submitButtonId. `
        + 'External submit uses onSubmit only; the internal button keeps its on_tap behavior.',
      );
    }
  }, [config.id, config.submitButtonId, onSubmit]);

  const validate = useCallback(async (): Promise<ValidationResult> => {
    const data = cloneDataModel(getDataModel());
    if (!formContext) {
      return {
        valid: false,
        formId: config.id,
        data,
        errors: { $form: 'Form context is unavailable.' },
      };
    }

    const builtIn = await formContext.validateAllDetailed();
    let result: ValidationResult = {
      valid: builtIn.valid,
      formId: config.id,
      data,
      errors: builtIn.errors,
    };

    if (result.valid && onValidate) {
      try {
        const custom = await onValidate(cloneDataModel(data), { formId: config.id });
        const customErrors = custom.errors ?? {};
        result = {
          valid: custom.valid && Object.keys(customErrors).length === 0,
          formId: config.id,
          data,
          errors: customErrors,
        };
        formContext.setExternalErrors(result.errors);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Custom validation failed.';
        result = {
          valid: false,
          formId: config.id,
          data,
          errors: { $form: message },
        };
        formContext.setExternalErrors(result.errors);
      }
    }

    return result;
  }, [config.id, formContext, getDataModel, onValidate]);

  const submit = useCallback(async (options: SubmitOptions = {}): Promise<SubmitResult> => {
    const data = cloneDataModel(getDataModel());

    if (submittingRef.current) {
      return {
        success: false,
        status: 'busy',
        formId: config.id,
        data,
      };
    }

    submittingRef.current = true;
    const shouldValidate = options.validate !== false;
    let validation: ValidationResult | undefined;
    try {
      if (shouldValidate) {
        validation = await validate();
        if (!validation.valid) {
          return {
            success: false,
            status: 'validation_failed',
            formId: config.id,
            data,
            validation,
          };
        }
      }

      if (!onSubmit) {
        return {
          success: false,
          status: 'no_handler',
          formId: config.id,
          data,
          validation,
          error: new Error('[FAUI] External submit requires an onSubmit handler.'),
        };
      }

      await onSubmit(cloneDataModel(data), {
        formId: config.id,
        validated: shouldValidate,
        validation,
        source: 'external',
      });
      return {
        success: true,
        status: 'submitted',
        formId: config.id,
        data,
        validation,
      };
    } catch (error) {
      return {
        success: false,
        status: 'error',
        formId: config.id,
        data,
        validation,
        error,
      };
    } finally {
      submittingRef.current = false;
    }
  }, [config.id, getDataModel, onSubmit, validate]);

  const controller = useMemo(() => ({ validate, submit }), [submit, validate]);

  useEffect(() => {
    registerForm(config.id, controller);
    return () => unregisterForm(config.id);
  }, [config.id, controller, registerForm, unregisterForm]);

  return (
    <div style={config.style as React.CSSProperties} className={config.className}>
      {children.map(childId => {
        const childComponent = componentMap.get(childId);
        if (!childComponent) {
          console.warn(`Component not found: ${childId}`);
          return null;
        }
        return (
          <ComponentRenderer
            key={childId}
            component={childComponent}
            componentMap={componentMap}
          />
        );
      })}
    </div>
  );
};
