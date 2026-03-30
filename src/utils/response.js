export const success = (data, message = 'Success', statusCode = 200) => ({
  status: 'success',
  statusCode,
  message,
  data,
});

export const error = (message = 'Error', statusCode = 500, errors = null) => ({
  status: 'error',
  statusCode,
  message,
  ...(errors && { errors }),
});

export const pagination = (data, page, perPage, total) => ({
  data,
  pagination: {
    page,
    perPage,
    total,
    pages: Math.ceil(total / perPage),
  },
});

export default { success, error, pagination };
