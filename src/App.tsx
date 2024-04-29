import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import {
  Button,
  Typography,
  TextField,
  Stack,
  Container,
  List,
  ListItem,
  ListItemText,
  Box,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

import { createTodo, deleteTodo, updateTodo } from './graphql/mutations';
import { listTodos } from './graphql/queries';
// import { withAuthenticator } from '@aws-amplify/ui-react';
// import '@aws-amplify/ui-react/styles.css';

import { Amplify } from 'aws-amplify';
import amplifyconfig from './amplifyconfiguration.json';

import type { Todo } from './API';
import type { AuthUser } from 'aws-amplify/auth';
import type { CreateTodoInput, UpdateTodoInput } from './API';
// import { type UseAuthenticator } from '@aws-amplify/ui-react-core';

Amplify.configure(amplifyconfig);

const initialState: CreateTodoInput = { name: '', description: '' };
const client = generateClient();

// type AppProps = {
//   signOut?: UseAuthenticator['signOut']; //() => void;
//   user?: AuthUser;
// };

// const App: React.FC<AppProps> = ({ signOut, user }) => {
const App = () => {
  const [formState, setFormState] = useState<CreateTodoInput | UpdateTodoInput>(initialState);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [editing, setEditing] = useState<boolean>(false);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const todoData = await client.graphql({
        query: listTodos,
      });
      const todos = todoData.data.listTodos.items;
      setTodos(todos);
    } catch (err) {
      console.log('error fetching todos');
    }
  };

  const addTodo = async () => {
    try {
      if (!formState.name || !formState.description) return;
      const todo = { ...formState } as CreateTodoInput;

      const result = await client.graphql({
        query: createTodo,
        variables: {
          input: todo,
        },
      });

      setTodos([...todos, result.data.createTodo]);
      setFormState(initialState);
    } catch (err) {
      console.log('error creating todo:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await client.graphql({
        query: deleteTodo,
        variables: {
          input: { id },
        },
      });

      const newTodos = todos.filter(todo => todo.id !== id);
      setTodos(newTodos);
    } catch (err) {
      console.log('error deleting todo:', err);
    }
  };

  const handleSetEditing = async (todo: Todo) => {
    setEditing(true);
    setFormState(todo);
  };

  const handleUpdateTodo = async () => {
    try {
      if (!formState.name || !formState.description || !formState.id) return;
      const todo = { ...formState } as UpdateTodoInput;

      const result = await client.graphql({
        query: updateTodo,
        variables: {
          input: {
            id: todo.id,
            name: todo.name,
            description: todo.description,
          },
        },
      });

      const newTodos = todos.map(t => (t.id === todo.id ? result.data.updateTodo : t));
      setTodos(newTodos);

      setEditing(false);
      setFormState(initialState);
    } catch (err) {
      console.log('error updating todo:', err);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setFormState(initialState);
  };

  return (
    <Container maxWidth="md">
      <Stack gap={2} alignItems="flex-start">
        {/* <Typography variant="h3">Hello {user?.username}</Typography>
        <Button onClick={signOut} variant="contained" color="secondary">
          Sign out
        </Button> */}
        <Typography variant="h3">Amplify Todos</Typography>

        <TextField
          onChange={event => setFormState({ ...formState, name: event.target.value })}
          value={formState.name}
          placeholder="Name"
          fullWidth
        />
        <TextField
          onChange={event => setFormState({ ...formState, description: event.target.value })}
          value={formState.description as string}
          placeholder="Description"
          fullWidth
        />

        <Stack direction="row" gap={2}>
          <Button onClick={editing ? handleUpdateTodo : addTodo} variant="contained">
            {editing ? 'Update' : 'Create'} todo
          </Button>
          {editing && <Button onClick={handleCancel}>Cancel</Button>}
        </Stack>

        <Box sx={{ width: '100%' }}>
          <List>
            {todos.map(todo => {
              return (
                <ListItem
                  key={todo.id}
                  divider
                  secondaryAction={
                    <Stack direction="row" gap={2}>
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => handleSetEditing(todo)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDelete(todo.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  }
                >
                  <ListItemText primary={todo.name} secondary={todo.description} />
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Stack>
    </Container>
  );
};

// export default withAuthenticator(App);
export default App;
