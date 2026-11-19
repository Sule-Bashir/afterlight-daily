import { reddit } from '@devvit/web/server';

export const createPost = async () => {
  return await reddit.submitCustomPost({
    title: '✳ AFTERLIGHT — The Vanishing Pattern | Daily Memory Challenge',
  });
};
