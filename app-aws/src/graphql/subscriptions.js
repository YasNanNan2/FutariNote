// GraphQL サブスクリプション定義
// ふたりノート - AWS AppSync用（リアルタイム同期）

export const onTaskCreated = /* GraphQL */ `
  subscription OnTaskCreated($partnerId: ID!) {
    onTaskCreated(partnerId: $partnerId) {
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

export const onTaskUpdated = /* GraphQL */ `
  subscription OnTaskUpdated($partnerId: ID!) {
    onTaskUpdated(partnerId: $partnerId) {
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

export const onTaskDeleted = /* GraphQL */ `
  subscription OnTaskDeleted($partnerId: ID!) {
    onTaskDeleted(partnerId: $partnerId) {
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

export const onGoalCreated = /* GraphQL */ `
  subscription OnGoalCreated($partnerId: ID!) {
    onGoalCreated(partnerId: $partnerId) {
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

export const onGoalUpdated = /* GraphQL */ `
  subscription OnGoalUpdated($partnerId: ID!) {
    onGoalUpdated(partnerId: $partnerId) {
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

export const onGoalDeleted = /* GraphQL */ `
  subscription OnGoalDeleted($partnerId: ID!) {
    onGoalDeleted(partnerId: $partnerId) {
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

export const onStampReceived = /* GraphQL */ `
  subscription OnStampReceived($partnerId: ID!) {
    onStampReceived(partnerId: $partnerId) {
      id
      from
      to
      stampType
      timestamp
    }
  }
`;
