import { queryRows } from "../db";

export const reportRepository = {
  async getSummaryRows(salonId: string, startDate: Date, endDate: Date) {
    const values = { salonId, startDate, endDate };

    const [earningsTotals] = await queryRows(`
      select coalesce(sum(total_amount), 0) as totalEarnings, count(*) as totalVisits
      from dbo.visits
      where tenant_id = @salonId and visit_date >= @startDate and visit_date <= @endDate
    `, values);

    const [expenseTotals] = await queryRows(`
      select coalesce(sum(amount), 0) as totalExpenses
      from dbo.expenses
      where tenant_id = @salonId and [date] >= @startDate and [date] <= @endDate
    `, values);

    const earningsByDay = await queryRows(`
      select convert(varchar(10), cast(visit_date as date), 23) as _id, coalesce(sum(total_amount), 0) as earnings
      from dbo.visits
      where tenant_id = @salonId and visit_date >= @startDate and visit_date <= @endDate
      group by cast(visit_date as date)
      order by cast(visit_date as date)
    `, values);

    const expensesByDay = await queryRows(`
      select convert(varchar(10), cast([date] as date), 23) as _id, coalesce(sum(amount), 0) as expenses
      from dbo.expenses
      where tenant_id = @salonId and [date] >= @startDate and [date] <= @endDate
      group by cast([date] as date)
      order by cast([date] as date)
    `, values);

    const expensesByCategory = await queryRows(`
      select category as _id, coalesce(sum(amount), 0) as total
      from dbo.expenses
      where tenant_id = @salonId and [date] >= @startDate and [date] <= @endDate
      group by category
      order by coalesce(sum(amount), 0) desc
    `, values);

    return {
      earningsTotals,
      expenseTotals,
      earningsByDay,
      expensesByDay,
      expensesByCategory,
    };
  },
};
