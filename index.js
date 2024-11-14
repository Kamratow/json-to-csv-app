import express from "express";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import fetch from "node-fetch";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const port = process.env.PORT || 3000;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from your side, please try again later.",
});

app.use(limiter);

app.use(helmet());

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "/index.html"));
});

app.get("/candidates", async (_req, res) => {
  try {
    const headers = {
      Authorization: `Token token=${process.env.API_KEY}`,
      "X-Api-Version": process.env.API_VERSION,
    };

    const candidatesResponse = await fetch(
      `${process.env.API_URL}/candidates`,
      { headers }
    );

    if (!candidatesResponse.ok) {
      throw new Error(`HTTP error! status: ${candidatesResponse.status}`);
    }

    const candidatesData = await candidatesResponse.json();

    const finalResult = [];

    const candidatePromises = candidatesData.data.map(
      async (singleCandidate) => {
        const jobApplicationsResponse = await fetch(
          singleCandidate.relationships["job-applications"].links.related,
          { headers }
        );

        const jobApplicationsData = await jobApplicationsResponse.json();

        for (const singleJobApplication of jobApplicationsData.data) {
          finalResult.push({
            candidate_id: singleCandidate.id,
            first_name: singleCandidate.attributes["first-name"],
            last_name: singleCandidate.attributes["last-name"],
            email: singleCandidate.attributes.email,
            job_application_id: singleJobApplication.id,
            job_application_created_at:
              singleJobApplication.attributes["created-at"],
          });
        }
      }
    );

    await Promise.all(candidatePromises);

    res.json({ data: finalResult });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// handle 404 not found error
app.use((_req, res) => {
  res.status(404).send("Resource not found");
});

// handle 500 internal server error
app.use((err, _req, res, _next) => {
  console.log(err.stack);
  res.status(500).send("Internal server error - try again later");
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
