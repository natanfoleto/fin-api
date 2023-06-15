import express from 'express';
import { v4 as  uuidv4} from 'uuid'

const app = express();

app.use(express.json());

const customers = [];

// Middleware
function verifyIfExistsAccountCpf(request, response, next) {
  const { cpf } = request.headers;

  const customer = customers.find(customer => customer.cpf === cpf);

  if (!customer) {
    return response.status(400).json({ error: 'Customer not found!'})
  }

  // Adicionando novo parâmetro de request no middleware
  request.customer = customer;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === 'credit') {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);return acc + operation.amount;

  return balance;
}

app.post('/account', (request, response) => {
  const { name, cpf } = request.body;

  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (customerAlreadyExists) {
    return response.status(400).json({ message: 'Customer already exists!'});
  }

  customers.push({
    id: uuidv4(),
    name,
    cpf,
    statement: [],
  });

  return response.status(201).json({ message: 'Customer created!'});
});

app.get('/account', verifyIfExistsAccountCpf, (request, response) => {
  const { customer } = request;

  return response.json(customer);
});

app.put('/account', verifyIfExistsAccountCpf, (request, response) => {
  const { customer } = request;
  const { name } = request.body;

  customer.name = name;

  return response.status(201).json({ message: 'Account updated!' })
});

app.delete('/account', verifyIfExistsAccountCpf, (request, response) => {
  const { customer } = request;

  customers.splice(customer, 1);

  return response.status(200).json({ 
    message: 'Account deleted!',
    customers 
  });
});

app.get('/statement', verifyIfExistsAccountCpf, (request, response) => {
  const { customer } = request;

  return response.json(customer.statement);
});

app.get('/statement/date', verifyIfExistsAccountCpf, (request, response) => {
  const { customer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + " 00:00");

  const statement = customer.statement.filter(
    (statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString()
  );

  return response.json(statement);
});

app.post('/deposit', verifyIfExistsAccountCpf, (request, response) => {
  const { customer } = request;
  const { description, amount } = request.body;

  const statmentOperation = {
    description,
    amount,
    created_at: new Date(),
    type: 'credit'
  };

  customer.statement.push(statmentOperation);

  return response.status(201).json({ message: 'Successfully deposited!' })
});

app.post('/withdraw', verifyIfExistsAccountCpf, (request, response) => {
  const { customer } = request;
  const { amount } = request.body;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return response.status(400).json({ message: 'Insufficient funds!'});
  }

  const statmentOperation = {
    amount,
    created_at: new Date(),
    type: 'debit'
  };

  customer.statement.push(statmentOperation);

  return response.status(201).json({ message: 'Successfully withdrawn!' });
});

app.get('/balance', verifyIfExistsAccountCpf, (request, response) => {
  const { customer } = request;

  const balance = getBalance(customer.statement);

  return response.json({ message: 'Success!', balance });
});

app.listen(3333);