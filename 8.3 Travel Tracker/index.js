import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import "dotenv/config";

const app = express();
const port = process.env.APP_PORT;

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

db.connect();

let countries = [];

async function getData() {
  db.query("SELECT country_code FROM visited_countries", (err, res) => {
    if (err) {
      console.error("Error executing query", err.stack);
    } else {
      countries = res.rows;
    }
  });
};

getData();

app.get("/", async (req, res) => {
  const total = countries.length;
  const countriesJSON = JSON.stringify(countries);
  res.render("index.ejs", { countriesJSON, total });
});

app.post("/add", async (req, res) => {
  const newCountry = req.body.country.toUpperCase();
  try {
    const countryCheckText = "SELECT * FROM countries WHERE country_code = $1";
    const values = [newCountry];
    const findCountry = await db.query(countryCheckText, values);
    if (findCountry.rowCount == 0) {
      console.log("No country found with that code");
      const countriesJSON = JSON.stringify(countries);
      const total = countries.length;
      return res.render("index.ejs", {
        countriesJSON, 
        total,
        error: "No country found with that code"
      });
    };
    try {
      const queryText = "INSERT INTO visited_countries(country_code) VALUES($1)";
      const addCountry = await db.query(queryText, values);
      countries.push({country_code: newCountry});
    } catch (error) {
        console.log("Country already recorded");
        const countriesJSON = JSON.stringify(countries);
        const total = countries.length;
        return res.render("index.ejs", {
          countriesJSON, 
          total,
          error: "Country already recorded"
        });
    };
  } catch (error) {
    console.log("The following error has occurred: " + error);

  };
  const countriesJSON = JSON.stringify(countries);
  const total = countries.length;
  res.render("index.ejs", {countriesJSON, total});
});

app.listen(process.env.APP_PORT, () => {
  console.log(`Server running on http://localhost:${process.env.APP_PORT}`);
});
