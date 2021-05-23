const supertest = require("supertest");
const { Users } = require("./model");
const { Workers } = require("../workers/model");
const testServer = require("../../test-server");
const { setupDB } = require("../../test-setup");
const request = supertest(testServer);
const fs = require("fs");
const { JWT, JWK } = require("jose");

const jwtKey = JWK.asKey(fs.readFileSync(process.env.JWT_KEY));

setupDB("swaggie-test", true);

describe("user endpoints", () => {
  const worker = {
    email: "worker@gmail.com",
    password: "Test1234",
    type: "worker"
  };
  const employer = {
    email: "employer@gmail.com",
    password: "Test1234",
    type: "employer"
  };
  const employerProfile = {
    abn: "12345678903",
    agreeTerms: true,
    companyDesc: "employer@gmail.com",
    contactPerson: "employer@gmail.com",
    entityName: "employer@gmail.com",
    isAgency: true,
    phone: "04000012",
    postcode: "4000",
    state: "QLD",
    street: "city road",
    suburb: "brisbane",
    unit: ""
  };
  const workerProfile = {
    firstName: "bob",
    lastName: "li",
    phone: "04000000",
    email: "1234@gmail.com",
    unit: "",
    street: "city",
    suburb: "brisbane",
    postcode: "4000",
    state: "QLD",
    categories: ["adventure"],
    availableFrom: new Date(),
    availableUntil: new Date(),
    interestLocation: "QLD",
    hoursFortnight: 20,
    aboutYou: "bob.li",
    isLegally: true,
    agreeTerms: true,
    dayShift: ["Monday"],
    nightShift: [],
    earlyShift: [],
    photoUrl: "",
    ongoingEngagement: true
  };
  it("create a new user (both employer and worker)", async done => {
    //Create a worker user
    const workerRes = await request.post("/api/users").send(worker);
    expect(workerRes.statusCode).toEqual(201);
    expect(workerRes.body.success).toEqual(true);

    const findWorker = await Users.findOne({ email: worker.email });
    expect(findWorker.email).toEqual(worker.email);

    //Create a employer user
    const employerRes = await request.post("/api/users").send(employer);
    expect(employerRes.statusCode).toEqual(201);
    expect(employerRes.body.success).toEqual(true);

    const findEmployer = await Users.findOne({ email: employer.email });
    expect(findEmployer.email).toEqual(employer.email);
    done();
  });

  it("mock email verified", async done => {
    //worker email verified
    const findWorker = await Users.findOne({ email: worker.email });
    expect(findWorker.email).toEqual(worker.email);
    await Users.findByIdAndUpdate(
      findWorker._id,
      {
        $set: {
          emailVerified: "true"
        }
      },
      { useFindAndModify: false }
    );
    const updatedWorker = await Users.findOne({ email: worker.email });
    expect(updatedWorker.emailVerified).toBe(true);
    //e,ployer email verified
    const findEmployer = await Users.findOne({ email: employer.email });
    expect(findEmployer.email).toEqual(employer.email);
    await Users.findByIdAndUpdate(
      findEmployer._id,
      {
        $set: {
          emailVerified: "true"
        }
      },
      { useFindAndModify: false }
    );
    const updatedEmployer = await Users.findOne({ email: employer.email });
    expect(updatedEmployer.emailVerified).toBe(true);

    done();
  });

  it("login", async done => {
    //await Users.create(mockUser);
    const user = await Users.findOne({ email: worker.email });
    expect(user.emailVerified).toBe(true);

    const res = await request
      .post("/api/users/sessions")
      .send({ email: worker.email, password: worker.password });
    expect(res.statusCode).toEqual(200);
    const verify = JWT.verify(res.body.token, jwtKey);
    expect(verify).toHaveProperty("userId");
    done();
  });

  it("create worker profile", async done => {
    const login = await request
      .post("/api/users/sessions")
      .send({ email: worker.email, password: worker.password });
    expect(login.statusCode).toEqual(200);
    const verify = JWT.verify(login.body.token, jwtKey);
    expect(verify).toHaveProperty("userId");

    const res = await request
      .post("/api/workers")
      .set("Authorization", `Bearer ${login.body.token}`)
      .send(workerProfile);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("_id");
    done();
  });

  it("create employer profile", async done => {
    const login = await request
      .post("/api/users/sessions")
      .send({ email: employer.email, password: employer.password });
    expect(login.statusCode).toEqual(200);
    const verify = JWT.verify(login.body.token, jwtKey);
    expect(verify).toHaveProperty("userId");

    const res = await request
      .post("/api/employers")
      .set("Authorization", `Bearer ${login.body.token}`)
      .send(employerProfile);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("_id");
    done();
  });
});
