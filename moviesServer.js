let express = require("express");
let passport = require("passport");
let jwt = require("jsonwebtoken");
let JWTStrategy = require("passport-jwt").Strategy;
let ExtractJwt = require("passport-jwt").ExtractJwt;
let app = express();
app.use(express.json());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST ,OPTIONS,PUT,PATCH,DELETE,HEAD"
  );
  res.header("Access-Contorl-Expose-Headers", "X-Auth-Token");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin,X-Requested,Content-Type,Accept,Authorization"
  );
  next();
});
var port = process.env.PORT || 2410;
app.listen(port, () => console.log(`Node app listening on port jai~ ${port}!`));
let fs = require("fs");
let fname = "moviesData.json";
let fhname = "hallsData.json";
let ftname = "ticketsData.json";
let flogin = "movieLogin.json";

const { results } = require("./data");
const { halls, tickets, loginData } = require("./data");

const params = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: "jwtsecret10012000",
};
const jwtExpirySeconds = 1200;

const strategyAll = new JWTStrategy(params, async function (token, done) {
  console.log("INJWTStrategy", token);
  try {
    let data = await fs.promises.readFile(flogin, "utf-8");
    let obj = JSON.parse(data);
    let user = obj.find(
      (e) => e.email === token.email && e.password === token.password
    );
    if (!user) {
      return done(null, false, { message: "Incorrect username and password" });
    } else return done(null, user);
  } catch (err) {
    res.send(err);
  }
});

passport.use(strategyAll);

app.get("/resetData", async function (req, res) {
  let data = JSON.stringify(results);
  let data2 = JSON.stringify(halls);
  let data3 = JSON.stringify(tickets);
  try {
    await fs.promises.writeFile(fname, data);
    await fs.promises.writeFile(fhname, data2);
    await fs.promises.writeFile(ftname, data3);
    res.send("resetData success");
  } catch (err) {
    res.send(err);
  }
});

app.get("/svr/resetLoginData", async function (req, res) {
  let data = JSON.stringify(loginData);
  try {
    await fs.promises.writeFile(flogin, data);
    res.send("resetLoginData success");
  } catch (err) {
    res.send(err);
  }
});

app.get("/movies/:location", async function (req, res) {
  const location = req.params.location;
  const { lang, genre, format, q } = req.query;
  try {
    let data = await fs.promises.readFile(fname, "utf-8");
    let data2 = await fs.promises.readFile(fhname, "utf-8");
    let obj = JSON.parse(data);
    if (lang) {
      let langArr = lang.split(",");
      obj = obj.filter((e) => e.lang.find((r) => langArr.find((f) => f === r)));
    }
    if (genre) {
      let genreArr = genre.split(",");
      obj = obj.filter((e) =>
        e.genre.find((r) => genreArr.find((f) => f === r))
      );
    }
    if (format) {
      let formatArr = format.split(",");
      obj = obj.filter((e) =>
        e.format.find((r) => formatArr.find((f) => f === r))
      );
    }
    if (q) {
      let qstr = q.toLowerCase();
      obj = obj.filter((e) => e.title.toLowerCase().indexOf(qstr) > -1);
      console.log(obj);
    }
    console.log(obj.length);
    console.log("obj2");
    let obj2 = JSON.parse(data2);
    let fin = obj2.find((e) => e.location === location);
    res.json({ results: obj, halls: fin });
  } catch (err) {
    res.send(err);
  }
});

app.get("/movies/:location/:id", async function (req, res) {
  let location = req.params.location;
  let id = req.params.id;
  try {
    let data = await fs.promises.readFile(fname, "utf-8");
    let data2 = await fs.promises.readFile(fhname, "utf-8");
    let obj = JSON.parse(data);
    let obj2 = JSON.parse(data2);
    let fin = obj.find((e) => e.imdbid === id);
    let fin2 = obj2.find((e) => e.location === location);
    res.json({ results: fin, halls: fin2 });
  } catch (err) {
    res.send(err);
  }
});
app.get("/movies/:time/:hallName/:title", async function (req, res) {
  const { time, hallName, title } = req.params;
  console.log(time, hallName, title);
  try {
    let data = await fs.promises.readFile(ftname, "utf-8");
    let obj = JSON.parse(data);
    // console.log(obj)
    let fin = obj.reduce(
      (a,c) =>
        c.time === time && c.movieHall === hallName && c.title === title
          ? [...a, ...c.tickets]
          : a,
      []
    );
    console.log("fin", fin);
    res.send(fin);
  } catch (err) {
    res.send(err);
  }
});

app.post("/login", async function (req, res) {
  let { email, password } = req.body;
  console.log(email, password);
  try {
    let data = await fs.promises.readFile(flogin, "utf-8");
    let obj = JSON.parse(data);
    let log = obj.find((e) => e.email === email && e.password === password);
    if (!log) {
      res.sendStatus(401);
    } else {
      let payload = { email: log.email, password: log.password };
      let token = jwt.sign(payload, params.secretOrKey, {
        algorithm: "HS256",
        expiresIn: jwtExpirySeconds,
      });
      res.setHeader("X-Auth-Token", token);
      // console.log(token);
      let it = { email: log.email,token: token };
      res.send(it);
    }
  } catch (err) {
    res.send(err);
  }
});

app.post(
  "/movies/booking",
  passport.authenticate("jwt", { session: false }),
  async function (req, res) {
    let body = req.body;
    console.log(body);
    try {
      let data = await fs.promises.readFile(ftname, "utf-8");
      let obj = JSON.parse(data);
      obj.push(body);
      let data1 = JSON.stringify(obj);
      try {
        await fs.promises.writeFile(ftname, data1);
        res.send(body);
      } catch (err) {
        res.send(err);
      }
    } catch (err) {
      res.send(err);
    }
  }
);

app.get(
  "/profile/:email",
  passport.authenticate("jwt", { session: false }),
  async function (req, res) {
    let email = req.params.email;
    console.log(email);
    try {
      let data = await fs.promises.readFile(ftname, "utf-8");
      let data2 = await fs.promises.readFile(flogin, "utf-8");
      let obj = JSON.parse(data);
      let obj2 = JSON.parse(data2);
      // console.log(obj);
      let fil = obj.filter((e) => e.email === email);
      let fin = obj2.find((e) => e.email === email);
      console.log("Fil", fil);
      res.json({arr:fil,details:fin});
    } catch (err) {
      res.send(err);
    }
  }
);
app.post(
  "/profile/save",
  passport.authenticate("jwt", { session: false }),
  async function (req, res) {
    let body = req.body;
    const {firstName="",lastName="",married="",email=""}=body;
    try {
      let data = await fs.promises.readFile(flogin, "utf-8");
      let obj = JSON.parse(data);
      let fin = obj.find((e) => e.email === email);
      fin.firstName=firstName;
      fin.lastName=lastName;
      fin.married=married;
      let data1 = JSON.stringify(obj);
      try {
        await fs.promises.writeFile(flogin, data1);
        res.send(body);
      } catch (err) {
        res.send(err);
      }
    } catch (err) {
      res.send(err);
    }
  }
);
