export function authorizeAny(...allowedRoles) {
  const normalized = allowedRoles.filter(Boolean);

  return (req, res, next) => {
    const userRoles = Array.isArray(req.user?.roles)
      ? req.user.roles.map((role) => role.name)
      : [];

    const isAllowed = normalized.length === 0 || normalized.some((role) => userRoles.includes(role));

    if (!isAllowed) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: insufficient role permissions',
      });
    }

    return next();
  };
}

export default {
  authorizeAny,
};
