export const moneyFormat = (money: string | number) => {
  return money ? money.toString(10).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : 0;
};
