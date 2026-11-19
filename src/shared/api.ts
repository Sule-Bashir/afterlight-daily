export type InitResponse = {
  type: 'init';
  postId: string;
  date: string;
  dailyNumber: string;
  username: string;
  signedIn: boolean;
  completedToday: boolean;
  dailyStreak: number;
};

export type SubmitRequest = {
  selected: number[];
};

export type SubmitResponse = {
  type: 'submit';
  accepted: boolean;
  alreadyCompleted: boolean;
  score: number;
  correct: number;
  wrong: number;
  missed: number;
  dailyStreak: number;
  completedToday: boolean;
};

export type ErrorResponse = {
  status: 'error';
  message: string;
};
