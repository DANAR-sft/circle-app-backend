// export const corsOptions = {
//   origin: ["http://localhost:5173", "http://localhost:4000"],
//   optionsSuccessStatus: 200,
// };
import cors from "cors";

const whitelist = [
  "http://localhost:5173",
  "http://localhost:4000",
  process.env.FRONTEND_URL,
];

export const corsOptions = cors({
  origin: function (origin: any, callback: any) {
    if (!origin) return callback(null, true);

    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
});
