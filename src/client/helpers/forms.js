import React from 'react';
import MaskedInput from 'react-maskedinput';


export function renderField(props) {
    const {
        id,
        input,
        placeholder,
        label,
        type,
        options,
        className,
        errorClassName,
        classNameWrapper,
        meta: { touched, error },
        bottomError,
        topLabel,
    } = props;

    if (type === 'textarea') {
        return (
            <div className={className || 'form-item'}>
                <textarea className="textarea-item" placeholder={placeholder} {...input}></textarea>
                {touched && error && <span className="errors">{error}</span>}
            </div>
        );
    } else if (type === 'select') {
        return (
            <div className={classNameWrapper}>
                {(touched && error && !bottomError) && <div className={errorClassName}>{error}</div>}
                <select {...input} className={className}>
                    {
                        options.map((option) => (
                            <option value={option.id} key={option.id}>{option.value}</option>
                        ))
                    }
                </select>
                {(touched && error && bottomError) && <div className={errorClassName}>{error}</div>}
            </div>
        );
    } else if (type === 'radio') {
        return (
            <div className={className}>
                <div className="rd">
                    <input
                        id={id}
                        type="radio"
                        {...input}
                    />
                    <label htmlFor={id}><span>{label}</span></label>
                </div>
            </div>
        );
    } else if (type === 'masked') {
        const { mask } = props;

        return (
            <div className={classNameWrapper}>
                {touched && error && <div className={errorClassName}>{error}</div>}
                <MaskedInput
                    className={ className }
                    placeholder={ placeholder }
                    mask={mask}
                    {...input}
                />
            </div>
        );
    } else if (type === 'hidden') {
        return (
            <input type={type} {...input} />
        );
    }

    return (
        <div className={classNameWrapper || ''}>
            {(touched && error && !bottomError) && <div className={errorClassName}>{error}</div>}
            {
                topLabel && (
                    <div className={`topLabel ${!(input.value && topLabel) ? 'labelHidden' : null}`}>{placeholder}</div>
                )
            }
            <input
                type={type}
                {...input}
                placeholder={placeholder}
                className={className}
            />
            {(touched && error && bottomError) && <div className={errorClassName}>{error}</div>}
        </div>
    );
}
