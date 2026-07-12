import Vehicle from "../../models/Vehicle.js";
import Trip from "../../models/Trip.js";
import MaintenanceLog from "../../models/MaintenanceLog.js";
import Expense from "../../models/Expense.js";

export const getFleetAnalytics = async (req, res) => {
  try {
    // 1. Fetch Completed Trips
    const completedTrips = await Trip.find({ status: "Completed", isActive: true });

    // Calculate total completed distance & fuel consumed
    let totalCompletedDistance = 0;
    let totalFuelConsumed = 0;
    let totalTripRevenue = 0;

    // Monthly revenue grouping object
    const monthlyRevenueMap = {};

    completedTrips.forEach((trip) => {
      totalCompletedDistance += trip.planned_distance || 0;
      totalFuelConsumed += trip.fuel_consumed || 0;

      // Simulated Revenue Formula: $2.50 per km + $0.15 per kg cargo
      const tripRevenue = ((trip.planned_distance || 0) * 2.5) + ((trip.cargo_weight || 0) * 0.15);
      totalTripRevenue += tripRevenue;

      // Group revenue by Month
      if (trip.completed_at) {
        const date = new Date(trip.completed_at);
        const monthKey = date.toLocaleString("en-US", { month: "short" }); // e.g. "Jan", "Feb"
        monthlyRevenueMap[monthKey] = (monthlyRevenueMap[monthKey] || 0) + tripRevenue;
      }
    });

    // Format Monthly Revenue for the chart
    const monthNamesOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyRevenue = monthNamesOrder
      .map((month) => ({
        name: month,
        revenue: Math.round(monthlyRevenueMap[month] || 0),
      }))
      .filter((item, idx, self) => {
        // Return only months that have data, or the last 6 months for clean visuals
        return item.revenue > 0 || idx <= new Date().getMonth();
      });

    // Calculate Fuel Efficiency
    const fuelEfficiency = totalFuelConsumed > 0 
      ? Math.round((totalCompletedDistance / totalFuelConsumed) * 10) / 10 
      : 0;

    // 2. Fleet Utilization
    const totalVehicles = await Vehicle.countDocuments({ isActive: true });
    const vehiclesOnTrip = await Vehicle.countDocuments({ status: "On Trip", isActive: true });
    const fleetUtilization = totalVehicles > 0 
      ? Math.round((vehiclesOnTrip / totalVehicles) * 100) 
      : 0;

    // 3. Operational Costs
    // Aggregate Maintenance costs
    const maintenanceCostsAggregate = await MaintenanceLog.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: "$cost" } } }
    ]);
    const totalMaintenanceCost = maintenanceCostsAggregate.length > 0 ? maintenanceCostsAggregate[0].total : 0;

    // Aggregate Expenses costs (Fuel + Tolls + Permits + others)
    const expensesCostsAggregate = await Expense.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalExpensesCost = expensesCostsAggregate.length > 0 ? expensesCostsAggregate[0].total : 0;

    const totalOperationalCost = Math.round(totalMaintenanceCost + totalExpensesCost);

    // 4. Vehicle Detailed ROI calculations
    const activeVehicles = await Vehicle.find({ isActive: true });

    let fleetTotalAcquisitionCost = 0;
    let fleetTotalNetRevenue = 0; // Revenue - (Maintenance + Fuel)

    const vehicleDetailedReport = [];

    for (const vehicle of activeVehicles) {
      const vId = vehicle._id;

      // Sum maintenance for this vehicle
      const maintenanceLogs = await MaintenanceLog.find({ vehicle_id: vId, isActive: true });
      const maintCost = maintenanceLogs.reduce((sum, log) => sum + (log.cost || 0), 0);

      // Sum expenses for this vehicle
      const vehicleExpenses = await Expense.find({ vehicle_id: vId, isActive: true });
      const fuelCost = vehicleExpenses
        .filter(exp => exp.expense_type === "Fuel")
        .reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const otherCost = vehicleExpenses
        .filter(exp => exp.expense_type !== "Fuel")
        .reduce((sum, exp) => sum + (exp.amount || 0), 0);

      // Sum completed trips revenue & distance
      const vehicleTrips = await Trip.find({ vehicle_id: vId, status: "Completed", isActive: true });
      const totalDistance = vehicleTrips.reduce((sum, t) => sum + (t.planned_distance || 0), 0);
      
      const vRevenue = vehicleTrips.reduce((sum, t) => {
        const tripRev = ((t.planned_distance || 0) * 2.5) + ((t.cargo_weight || 0) * 0.15);
        return sum + tripRev;
      }, 0);

      // ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost
      const acqCost = vehicle.acquisition_cost || 1; // Default to 1 to avoid division by zero
      const netProfit = vRevenue - (maintCost + fuelCost);
      const vRoi = Math.round((netProfit / acqCost) * 100 * 10) / 10;

      fleetTotalAcquisitionCost += vehicle.acquisition_cost || 0;
      fleetTotalNetRevenue += netProfit;

      vehicleDetailedReport.push({
        _id: vId,
        registration_number: vehicle.registration_number,
        name_model: vehicle.name_model,
        status: vehicle.status,
        acquisition_cost: vehicle.acquisition_cost || 0,
        distance_traveled: Math.round(totalDistance),
        maintenance_cost: Math.round(maintCost),
        fuel_cost: Math.round(fuelCost),
        other_cost: Math.round(otherCost),
        total_operational_cost: Math.round(maintCost + fuelCost + otherCost),
        revenue: Math.round(vRevenue),
        roi: vRoi,
      });
    }

    // Fleet ROI = Total Net Profit / Total Acquisition Cost
    const fleetRoi = fleetTotalAcquisitionCost > 0
      ? Math.round((fleetTotalNetRevenue / fleetTotalAcquisitionCost) * 100 * 10) / 10
      : 0;

    // Top Costliest Vehicles (Sort by total operational cost)
    const topCostliestVehicles = [...vehicleDetailedReport]
      .sort((a, b) => b.total_operational_cost - a.total_operational_cost)
      .slice(0, 5)
      .map((item) => ({
        name: item.registration_number,
        cost: item.total_operational_cost,
        name_model: item.name_model,
      }));

    res.status(200).json({
      isOk: true,
      message: "Fleet analytics compiled successfully",
      data: {
        summary: {
          fuelEfficiency,
          fleetUtilization,
          operationalCost: totalOperationalCost,
          fleetRoi,
        },
        monthlyRevenue,
        topCostliestVehicles,
        detailedReport: vehicleDetailedReport,
      },
    });
  } catch (error) {
    console.error("Error compiling fleet analytics:", error);
    res.status(500).json({
      isOk: false,
      message: "Error compiling fleet analytics",
      error: error.message,
    });
  }
};
