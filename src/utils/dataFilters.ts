const getStartDate = (startDate: Date | undefined): Date => {
  if (!startDate) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return thirtyDaysAgo;
  }
  return new Date(startDate);
};
  
const getEndDate = (endDate: Date | undefined): Date => {
  if (!endDate) {
    const currentDate = new Date();
    currentDate.setHours(23, 59, 59, 999); // Set time to the end of the day
    return currentDate;
  }
  return new Date(endDate);
};
  
const getLimit = (limit: string | undefined): number => {
  if (!limit) {
    return 10;
  }
  return parseInt(limit, 10);
};
  
const getPage = (page: string | undefined): number => {
  if (!page) {
    return 1;
  }
  return parseInt(page, 10);
};
  
const paginateData = <T>(data: T[], limit: number, page: number): T[] => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  return data.slice(startIndex, endIndex);
};
  
export {
  paginateData,
  getLimit,
  getPage,
  getEndDate,
  getStartDate,
};
  