import { DashBoardSummary}  from "../utils/dashboardService.js";

export const dashboard = async (req, res) => {
  try {
    const userId = req.user.id; // authenticated user
    const summary = await DashBoardSummary(userId);
    res.status(200).json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
};
