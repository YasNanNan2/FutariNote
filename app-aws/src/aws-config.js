// AWS Amplify Configuration
// CDK AuthStack / ApiStack からの出力値を使用

const awsconfig = {
  Auth: {
    Cognito: {
      userPoolId: 'ap-northeast-1_oE4IXt6At',
      userPoolClientId: 'kk2can5l3s2uf2ivt5bba3pmb',
      loginWith: {
        oauth: {
          domain: 'futarinote-dev.auth.ap-northeast-1.amazoncognito.com',
          scopes: ['email', 'openid', 'profile', 'aws.cognito.signin.user.admin'],
          redirectSignIn: ['http://localhost:5173/', 'http://localhost:3000/', 'https://d3fxuueke57xsi.cloudfront.net/'],
          redirectSignOut: ['http://localhost:5173/', 'http://localhost:3000/', 'https://d3fxuueke57xsi.cloudfront.net/'],
          responseType: 'code',
        },
      },
    },
  },
  API: {
    GraphQL: {
      endpoint: 'https://w5qxw6pm2nhi5fpslgmmsiuxnm.appsync-api.ap-northeast-1.amazonaws.com/graphql',
      region: 'ap-northeast-1',
      defaultAuthMode: 'userPool',
    },
  },
};

export default awsconfig;
