const ticketRegex = /^[A-Z]{2,}-\d+: [a-z].+$/;

export default {
  plugins: [
    {
      rules: {
        'ticket-format': ({ header }) => {
          const valid = ticketRegex.test(header);

          return [valid, 'Commit must follow: XXX-123: <What this commit will do?>'];
        },
      },
    },
  ],

  rules: {
    'ticket-format': [2, 'always'],
    'header-max-length': [2, 'always', 100],
  },
};
