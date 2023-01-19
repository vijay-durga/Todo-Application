const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

let format = require("date-fns/format");
let isMatch = require("date-fns/isMatch");
let isValid = require("date-fns/isValid");

app.use(express.json());
let db = null;

const initializationDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB error '${error.message}'`);
    process.exit(1);
  }
};

initializationDbAndServer();

//api-1

const hasPriorityAndStatusProperty = (each) => {
  return each.priority !== undefined && each.status !== undefined;
};

const hasCategoryAndStatusProperty = (each) => {
  return each.category !== undefined && each.status !== undefined;
};

const hasCategoryAndPriorityProperty = (each) => {
  return each.category !== undefined && each.priority !== undefined;
};

const hasPriorityProperty = (each) => {
  return each.priority !== undefined;
};

const hasStatusProperty = (each) => {
  return each.status !== undefined;
};

const hasCategoryProperty = (each) => {
  return each.category !== undefined;
};

const hasSearchProperty = (each) => {
  return each.search_q !== undefined;
};

const outputResult = (each) => {
  return {
    id: each.id,
    todo: each.todo,
    priority: each.priority,
    category: each.category,
    status: each.status,
    dueDate: each.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let dataQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperty(request.query):
      if (
        request.query.priority === "HIGH" ||
        request.query.priority === "MEDIUM" ||
        request.query.priority === "LOW"
      ) {
        if (
          request.query.status === "TO DO" ||
          request.query.status === "IN PROGRESS" ||
          request.query.status === "DONE"
        ) {
          dataQuery = `select * from todo where priority = '${priority}' and status = '${status}';`;
          data = await db.all(dataQuery);
          response.send(data.map((each) => outputResult(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;

    case hasCategoryAndStatusProperty(request.query):
      if (
        request.query.category === "WORK" ||
        request.query.category === "HOME" ||
        request.query.category === "LEARNING"
      ) {
        if (
          request.query.status === "TO DO" ||
          request.query.status === "IN PROGRESS" ||
          request.query.status === "DONE"
        ) {
          dataQuery = `select * from todo where category = '${category}' and status = '${status}';`;
          data = await db.all(dataQuery);
          response.send(data.map((each) => outputResult(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasCategoryAndPriorityProperty(request.query):
      if (
        request.query.category === "WORK" ||
        request.query.category === "HOME" ||
        request.query.category === "LEARNING"
      ) {
        if (
          request.query.priority === "LOW" ||
          request.query.priority === "MEDIUM" ||
          request.query.priority === "HIGH"
        ) {
          dataQuery = `select * from todo where category = '${category}' and priority = '${priority}';`;
          data = await db.all(dataQuery);
          response.send(data.map((each) => outputResult(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasPriorityProperty(request.query):
      if (
        request.query.priority === "LOW" ||
        request.query.priority === "MEDIUM" ||
        request.query.priority === "HIGH"
      ) {
        dataQuery = `select * from todo where priority = '${priority}';`;
        data = await db.all(dataQuery);
        response.send(data.map((each) => outputResult(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasStatusProperty(request.query):
      if (
        request.query.status === "TO DO" ||
        request.query.status === "IN PROGRESS" ||
        request.query.status === "DONE"
      ) {
        dataQuery = `select * from todo where status = '${status}';`;
        data = await db.all(dataQuery);
        response.send(data.map((each) => outputResult(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case hasCategoryProperty(request.query):
      if (
        request.query.category === "WORK" ||
        request.query.category === "HOME" ||
        request.query.category === "LEARNING"
      ) {
        dataQuery = `select * from todo where category = '${category}';`;
        data = await db.all(dataQuery);
        response.send(data.map((each) => outputResult(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasSearchProperty(request.query):
      dataQuery = `select * from todo where search_q like '%${search_q}%';`;
      data = await db.all(dataQuery);
      response.send(data.map((each) => outputResult(each)));
      break;

    default:
      dataQuery = `select * from todo`;
      data = await db.all(dataQuery);
      response.send(data.map((each) => outputResult(each)));
  }
});

//api-2

app.get(`/todos/:todoId/`, async (request, response) => {
  const { todoId } = request.params;
  const dataQuery = `select * from todo where id = ${todoId};`;
  const data = await db.get(dataQuery);
  response.send(outputResult(data));
});

//api-3

app.get(`/agenda/`, async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const dateQuery = `select * from todo where due_date = '${newDate}';`;
    const resultDate = await db.all(dateQuery);
    response.send(resultDate.map((each) => outputResult(each)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//api-4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const todoQuery = `
  INSERT INTO
    todo (id, todo, category,priority, status, due_date)
  VALUES
    (${id}, '${todo}', '${category}','${priority}', '${status}', '${newDueDate}');`;
          await db.run(todoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//api-5
app.put(`/todos/:todoId/`, async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;

  let updateColumn = "";

  const previousTodoDetailsQuery = `select * from todo where id = ${todoId} ;`;
  const previousDetails = await db.get(previousTodoDetailsQuery);
  const {
    todo = previousDetails.todo,
    priority = previousDetails.priority,
    status = previousDetails.status,
    category = previousDetails.category,
    dueDate = previousDetails.dueDate,
  } = request.body;

  let updateQuery;

  switch (true) {
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        updateQuery = `update todo set priority='${priority}' , status = '${status}' , category = '${category}' , due_date = '${dueDate}' where id = ${todoId} ;`;
        await db.run(updateQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateQuery = `update todo set priority='${priority}' , status = '${status}' , category = '${category}' , due_date = '${dueDate}' where id = ${todoId} ;`;
        await db.run(updateQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateQuery = `update todo set priority='${priority}' , status = '${status}' , category = '${category}' , due_date = '${dueDate}' where id = ${todoId} ;`;
        await db.run(updateQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateQuery = `update todo set priority='${priority}' , status = '${status}' , category = '${category}' , due_date = '${newDate}' where id = ${todoId} ;`;
        await db.run(updateQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;

    case requestBody.todo !== undefined:
      updateQuery = `update todo set priority='${priority}' , status = '${status}' , category = '${category}' , due_date = '${dueDate}' where id = ${todoId} ;`;
      await db.run(updateQuery);
      response.send("Todo Updated");

      break;
  }
});

//api-6
app.delete(`/todos/:todoId/`, async (request, response) => {
  const { todoId } = request.params;
  const dataQuery = `delete from todo where id = ${todoId};`;
  const data = await db.run(dataQuery);
  response.send("Todo Deleted");
});

module.exports = app;
