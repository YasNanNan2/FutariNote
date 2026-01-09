// GraphQL クエリ定義
// ふたりノート - AWS AppSync用

export const getCouple = /* GraphQL */ `
  query GetCouple($partnerId: ID!) {
    getCouple(partnerId: $partnerId) {
      id
      users {
        userId
        name
        email
        color
      }
      totalStamps {
        love
        thanks
        star
        muscle
        sparkle
        heart
      }
      createdAt
    }
  }
`;

export const getMe = /* GraphQL */ `
  query GetMe {
    getMe {
      userId
      name
      email
      color
      partnerId
      createdAt
    }
  }
`;

export const getTasks = /* GraphQL */ `
  query GetTasks($partnerId: ID!, $limit: Int, $nextToken: String) {
    getTasks(partnerId: $partnerId, limit: $limit, nextToken: $nextToken) {
      id
      partnerId
      title
      date
      assignee
      category
      completed
      createdBy
      createdAt
      completedAt
    }
  }
`;

export const getTasksByMonth = /* GraphQL */ `
  query GetTasksByMonth($partnerId: ID!, $month: String!) {
    getTasksByMonth(partnerId: $partnerId, month: $month) {
      id
      partnerId
      title
      date
      assignee
      category
      completed
      createdBy
      createdAt
      completedAt
    }
  }
`;

export const getTasksByDate = /* GraphQL */ `
  query GetTasksByDate($partnerId: ID!, $date: AWSDate!) {
    getTasksByDate(partnerId: $partnerId, date: $date) {
      id
      partnerId
      title
      date
      assignee
      category
      completed
      createdBy
      createdAt
      completedAt
    }
  }
`;

export const getTask = /* GraphQL */ `
  query GetTask($partnerId: ID!, $id: ID!) {
    getTask(partnerId: $partnerId, id: $id) {
      id
      partnerId
      title
      date
      assignee
      category
      completed
      createdBy
      createdAt
      completedAt
    }
  }
`;

export const getGoals = /* GraphQL */ `
  query GetGoals($partnerId: ID!) {
    getGoals(partnerId: $partnerId) {
      id
      partnerId
      title
      deadline
      icon
      targetAmount
      currentAmount
      achieved
      achievedAt
      createdAt
    }
  }
`;

export const getGoal = /* GraphQL */ `
  query GetGoal($partnerId: ID!, $id: ID!) {
    getGoal(partnerId: $partnerId, id: $id) {
      id
      partnerId
      title
      deadline
      icon
      targetAmount
      currentAmount
      achieved
      achievedAt
      createdAt
    }
  }
`;

export const getTimeline = /* GraphQL */ `
  query GetTimeline($partnerId: ID!, $limit: Int, $nextToken: String) {
    getTimeline(partnerId: $partnerId, limit: $limit, nextToken: $nextToken) {
      id
      timestamp
      user
      userColor
      action
      details
    }
  }
`;

export const getStamps = /* GraphQL */ `
  query GetStamps($partnerId: ID!, $limit: Int, $nextToken: String) {
    getStamps(partnerId: $partnerId, limit: $limit, nextToken: $nextToken) {
      id
      from
      to
      stampType
      timestamp
      taskId
    }
  }
`;

export const validateInviteCode = /* GraphQL */ `
  query ValidateInviteCode($code: String!) {
    validateInviteCode(code: $code) {
      code
      userId
      partnerId
      expiresAt
    }
  }
`;
