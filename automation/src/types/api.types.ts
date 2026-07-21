export type TestUser = {
  email: string;
  password: string;
  token: string;
  id?: string;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  created_at?: string;
  updated_at?: string;
};

export type NoteInput = {
  title: string;
  content: string;
};
