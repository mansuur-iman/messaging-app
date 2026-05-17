export const paginateUsers = (page: number, limit: number) => {
  const safePage = Math.max(1, page);

  // minimum 1, maximum 50
  const safeLimit = Math.min(50, Math.max(1, limit));

  const skip = (safePage - 1) * safeLimit;

  return {
    skip,
    limit: safeLimit,
    page: safePage,
  };
};
