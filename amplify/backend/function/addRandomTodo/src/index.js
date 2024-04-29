/* Amplify Params - DO NOT EDIT
	API_AMPLIFYDEMO3_GRAPHQLAPIENDPOINTOUTPUT
	API_AMPLIFYDEMO3_GRAPHQLAPIIDOUTPUT
	API_AMPLIFYDEMO3_GRAPHQLAPIKEYOUTPUT
	ENV
	REGION
Amplify Params - DO NOT EDIT */

const { default: fetch, Request } = require('node-fetch');

const GRAPHQL_ENDPOINT = process.env.API_AMPLIFYDEMO3_GRAPHQLAPIENDPOINTOUTPUT;
const GRAPHQL_API_KEY = process.env.API_AMPLIFYDEMO3_GRAPHQLAPIKEYOUTPUT;

const query = /* GraphQL */ `
  mutation CREATE_TODO($input: CreateTodoInput!) {
    createTodo(input: $input) {
      id
      name
      createdAt
    }
  }
`;

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async event => {
  console.log(`EVENT: ${JSON.stringify(event)}`);

  let fetchedTodo;
  let statusCode = 200;
  let body;
  let response;

  try {
    fetchedTodo = await fetch('https://dummyjson.com/todos/random').then(res => res.json());
  } catch (error) {
    console.error(error);
  }

  if (!fetchedTodo) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Failed to fetch a  todo' }),
    };
  }

  const variables = {
    input: {
      name: fetchedTodo.todo,
    },
  };

  /** @type {import('node-fetch').RequestInit} */
  const options = {
    method: 'POST',
    headers: {
      'x-api-key': GRAPHQL_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  };

  const request = new Request(GRAPHQL_ENDPOINT, options);

  try {
    response = await fetch(request);
    body = await response.json();
    if (body.errors) statusCode = 400;
  } catch (error) {
    statusCode = 400;
    body = {
      errors: [
        {
          status: response.status,
          message: error.message,
          stack: error.stack,
        },
      ],
    };
  }

  return {
    statusCode,
    body: JSON.stringify(body),
  };
};
