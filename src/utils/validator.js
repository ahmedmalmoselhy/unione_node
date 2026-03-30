/**
 * Validation middleware factory
 * @param {object} schema - Joi validation schema
 * @param {string} property - Request property to validate (body, query, params)
 * @returns {function} Express middleware function
 */
export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: messages,
      });
    }

    req[property] = value;
    next();
  };
};

export default validate;
