import { useState } from 'react';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { withAuthenticator } from '@aws-amplify/ui-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
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

import {
  createTodo,
  deleteTodo as deleteTodoQuery,
  updateTodo as updateTodoQuery,
} from './graphql/mutations';
import { listTodos } from './graphql/queries';
import amplifyconfig from './amplifyconfiguration.json';

import type { Todo } from './API';
import type { AuthUser } from 'aws-amplify/auth';
import type { CreateTodoInput, UpdateTodoInput } from './API';
import type { UseAuthenticator } from '@aws-amplify/ui-react-core';

import '@aws-amplify/ui-react/styles.css';

Amplify.configure(amplifyconfig);

const initialState: CreateTodoInput = { name: '', description: '' };
const client = generateClient();

type AppProps = {
  signOut?: UseAuthenticator['signOut']; //() => void;
  user?: AuthUser;
};

const getAllTodos = async () => {
  const result = await client.graphql({
    query: listTodos,
  });
  return result.data.listTodos.items;
};

const addNewTodo = async (newTodo: CreateTodoInput) => {
  const result = await client.graphql({
    query: createTodo,
    variables: {
      input: newTodo,
    },
  });
  return result.data.createTodo;
};

const updateTodo = async (todo: UpdateTodoInput) => {
  const result = await client.graphql({
    query: updateTodoQuery,
    variables: {
      input: {
        id: todo.id,
        name: todo.name,
        description: todo.description,
      },
    },
  });
  return result.data.updateTodo;
};

const deleteTodo = async (id: string) => {
  await client.graphql({
    query: deleteTodoQuery,
    variables: {
      input: { id },
    },
  });
};

const App: React.FC<AppProps> = ({ signOut, user }) => {
  const [formState, setFormState] = useState<CreateTodoInput | UpdateTodoInput>(initialState);
  const [editing, setEditing] = useState<boolean>(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: getAllTodos,
  });

  const { mutate: mutationCreate, isPending: isCreatePending } = useMutation({
    mutationFn: addNewTodo,
    onSuccess: data => {
      queryClient.setQueryData(['todos'], (oldData: Todo[] | undefined) => {
        return oldData ? [...oldData, data] : [data];
      });
      setFormState(initialState);
    },
    onError: error => {
      console.log('error creating todo:', error);
    },
  });

  const { mutate: mutationUpdate, isPending: isUpdatePending } = useMutation({
    mutationFn: updateTodo,
    onSuccess: data => {
      queryClient.setQueryData(['todos'], (oldData: Todo[] | undefined) => {
        return oldData ? oldData.map(todo => (todo.id === data.id ? data : todo)) : [data];
      });
      setFormState(initialState);
      setEditing(false);
    },
    onError: error => {
      console.log('error updating todo:', error);
    },
  });

  const { mutate: mutationDelete, isPending: isDeletePending } = useMutation({
    mutationFn: deleteTodo,
    onSuccess: (data, id) => {
      queryClient.setQueryData(['todos'], (oldData: Todo[] | undefined) => {
        return oldData ? oldData.filter(todo => todo.id !== id) : [];
      });
    },
    onError: error => {
      console.log('error deleting todo:', error);
    },
  });

  const handleSetEditing = async (todo: Todo) => {
    setEditing(true);
    setFormState(todo);
  };

  const handleCancel = () => {
    setEditing(false);
    setFormState(initialState);
  };

  const isProcessing = isCreatePending || isUpdatePending || isDeletePending;
  return (
    <Container maxWidth="md">
      <Stack gap={2} alignItems="flex-start">
        <Typography variant="h3">Hello {user?.username}</Typography>
        <Button onClick={signOut} variant="contained" color="secondary">
          Sign out
        </Button>
        <Typography variant="h3">Amplify Todos</Typography>

        <TextField
          onChange={event => setFormState({ ...formState, name: event.target.value })}
          value={formState.name}
          placeholder="Name"
          fullWidth
          disabled={isProcessing}
        />
        <TextField
          onChange={event => setFormState({ ...formState, description: event.target.value })}
          value={formState.description as string}
          placeholder="Description"
          fullWidth
          disabled={isProcessing}
        />

        <Stack direction="row" gap={2}>
          {!editing ? (
            <Button
              onClick={() => mutationCreate(formState as CreateTodoInput)}
              variant="contained"
              disabled={isProcessing}
            >
              Create todo
            </Button>
          ) : (
            <>
              <Button
                onClick={() => mutationUpdate(formState as UpdateTodoInput)}
                variant="contained"
                disabled={isProcessing}
              >
                Update todo
              </Button>
              <Button onClick={handleCancel} disabled={isProcessing}>
                Cancel
              </Button>
            </>
          )}
        </Stack>

        {isLoading && (
          <Typography variant="body2" color="text.secondary">
            Loading Todos...
          </Typography>
        )}

        {data && data.length > 0 && (
          <Box sx={{ width: '100%' }}>
            <List>
              {data.map(todo => {
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
                          onClick={() => mutationDelete(todo.id)}
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
        )}
      </Stack>
    </Container>
  );
};

export default withAuthenticator(App);
