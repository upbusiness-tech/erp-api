export function toArrayISO(dates: any[]) {
  const transformadas = dates.map((date) => {
    return (date as any).toDate()
  })
  return transformadas
}