// GraphQL ミューテーション定義
// ふたりノート - AWS AppSync用

export const updateUser = /* GraphQL */ `
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      userId
      name
      email
      color
      partnerId
      createdAt
    }
  }
`;

export const createTask = /* GraphQL */ `
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
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

export const updateTask = /* GraphQL */ `
  mutation UpdateTask($input: UpdateTaskInput!) {
    updateTask(input: $input) {
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

export const completeTask = /* GraphQL */ `
  mutation CompleteTask($partnerId: ID!, $taskId: ID!) {
    completeTask(partnerId: $partnerId, taskId: $taskId) {
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

// 完了取り消し（対応する Timeline エントリも削除される）
export const uncompleteTask = /* GraphQL */ `
  mutation UncompleteTask($partnerId: ID!, $taskId: ID!) {
    uncompleteTask(partnerId: $partnerId, taskId: $taskId) {
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

export const deleteTask = /* GraphQL */ `
  mutation DeleteTask($partnerId: ID!, $taskId: ID!) {
    deleteTask(partnerId: $partnerId, taskId: $taskId) {
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

export const createGoal = /* GraphQL */ `
  mutation CreateGoal($input: CreateGoalInput!) {
    createGoal(input: $input) {
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

export const updateGoal = /* GraphQL */ `
  mutation UpdateGoal($input: UpdateGoalInput!) {
    updateGoal(input: $input) {
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

export const deleteGoal = /* GraphQL */ `
  mutation DeleteGoal($partnerId: ID!, $goalId: ID!) {
    deleteGoal(partnerId: $partnerId, goalId: $goalId) {
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

export const sendStamp = /* GraphQL */ `
  mutation SendStamp($input: SendStampInput!) {
    sendStamp(input: $input) {
      id
      from
      to
      stampType
      timestamp
      taskId
    }
  }
`;

export const createInviteCode = /* GraphQL */ `
  mutation CreateInviteCode {
    createInviteCode {
      code
      userId
      partnerId
      expiresAt
    }
  }
`;

export const joinCouple = /* GraphQL */ `
  mutation JoinCouple($code: String!) {
    joinCouple(code: $code) {
      id
      createdAt
    }
  }
`;

export const leaveCouple = /* GraphQL */ `
  mutation LeaveCouple {
    leaveCouple
  }
`;

export const deleteAccount = /* GraphQL */ `
  mutation DeleteAccount {
    deleteAccount {
      success
      deletedItems
    }
  }
`;
