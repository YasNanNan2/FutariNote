import * as cdk from 'aws-cdk-lib/core';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export interface ApiStackProps extends cdk.StackProps {
    readonly environment: 'dev' | 'prod';
    readonly userPool: cognito.IUserPool;
}

/**
 * ApiStack - AppSync API と DynamoDB テーブルを管理
 */
export class ApiStack extends cdk.Stack {
    public readonly api: appsync.GraphqlApi;
    public readonly table: dynamodb.Table;

    constructor(scope: Construct, id: string, props: ApiStackProps) {
        super(scope, id, props);

        const { environment, userPool } = props;

        // ===========================================
        // 1. DynamoDB テーブル（シングルテーブル設計）
        // ===========================================
        this.table = new dynamodb.Table(this, 'FutarinoteTable', {
            tableName: `futarinote-${environment}-table`,
            partitionKey: {
                name: 'PK',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'SK',
                type: dynamodb.AttributeType.STRING,
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,

            // Point-in-Time Recovery（バックアップ）
            pointInTimeRecovery: true,

            // 削除保護（本番環境のみ）
            deletionProtection: environment === 'prod',

            // 削除時の挙動
            removalPolicy: environment === 'prod'
                ? cdk.RemovalPolicy.RETAIN
                : cdk.RemovalPolicy.DESTROY,
        });

        // GSI1: assignee-date-index（タスクの担当者・日付検索用）
        this.table.addGlobalSecondaryIndex({
            indexName: 'assignee-date-index',
            partitionKey: {
                name: 'assignee',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'date',
                type: dynamodb.AttributeType.STRING,
            },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // GSI2: invite-code-index（招待コード検索用）
        this.table.addGlobalSecondaryIndex({
            indexName: 'invite-code-index',
            partitionKey: {
                name: 'inviteCode',
                type: dynamodb.AttributeType.STRING,
            },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // ===========================================
        // 2. AppSync GraphQL API
        // ===========================================
        this.api = new appsync.GraphqlApi(this, 'FutarinoteApi', {
            name: `futarinote-${environment}-api`,

            // GraphQL スキーマ（後で定義ファイルを作成）
            definition: appsync.Definition.fromFile(
                path.join(__dirname, 'graphql', 'schema.graphql')
            ),

            // 認証設定: Cognito User Pool
            authorizationConfig: {
                defaultAuthorization: {
                    authorizationType: appsync.AuthorizationType.USER_POOL,
                    userPoolConfig: {
                        userPool,
                    },
                },
            },

            // ログ設定
            logConfig: {
                fieldLogLevel: appsync.FieldLogLevel.ERROR,
                excludeVerboseContent: false,
            },

            // X-Ray トレーシング
            xrayEnabled: true,
        });

        // ===========================================
        // 3. DynamoDB データソース
        // ===========================================
        const dataSource = this.api.addDynamoDbDataSource(
            'FutarinoteDataSource',
            this.table
        );

        // ===========================================
        // 4. VTL Resolvers（Task CRUD）
        // ===========================================

        // createTask Resolver
        dataSource.createResolver('CreateTaskResolver', {
            typeName: 'Mutation',
            fieldName: 'createTask',
            requestMappingTemplate: appsync.MappingTemplate.fromString(`
                #set($partnerId = $ctx.arguments.input.partnerId)
                #set($taskId = $util.autoId())
                {
                    "version": "2017-02-28",
                    "operation": "PutItem",
                    "key": {
                        "PK": { "S": "COUPLE#$partnerId" },
                        "SK": { "S": "TASK#$taskId" }
                    },
                    "attributeValues": {
                        "id": { "S": "$taskId" },
                        "partnerId": { "S": "$partnerId" },
                        "title": { "S": "$ctx.arguments.input.title" },
                        "assignee": { "S": "$ctx.arguments.input.assignee" },
                        "date": { "S": "$ctx.arguments.input.date" },
                        "category": { "S": "$ctx.arguments.input.category" },
                        "createdBy": { "S": "$ctx.identity.sub" },
                        "createdAt": { "S": "$util.time.nowISO8601()" },
                        "completed": { "BOOL": false }
                    }
                }
            `),
            responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
        });

        // ===========================================
        // getCouple Resolver - カップル情報を取得
        // ===========================================
        dataSource.createResolver('GetCoupleResolver', {
            typeName: 'Query',
            fieldName: 'getCouple',
            requestMappingTemplate: appsync.MappingTemplate.fromString(`
                #set($partnerId = $ctx.arguments.partnerId)
                {
                    "version": "2017-02-28",
                    "operation": "GetItem",
                    "key": {
                        "PK": { "S": "COUPLE#$partnerId" },
                        "SK": { "S": "COUPLE#METADATA" }
                    }
                }
            `),
            responseMappingTemplate: appsync.MappingTemplate.fromString(`
                #if($ctx.result)
                    $util.toJson($ctx.result)
                #else
                    null
                #end
            `),
        });

        // getTasks Resolver
        dataSource.createResolver('GetTasksResolver', {
            typeName: 'Query',
            fieldName: 'getTasks',
            requestMappingTemplate: appsync.MappingTemplate.fromString(`
                #set($partnerId = $ctx.arguments.partnerId)
                {
                    "version": "2017-02-28",
                    "operation": "Query",
                    "query": {
                        "expression": "PK = :pk AND begins_with(SK, :sk)",
                        "expressionValues": {
                            ":pk": { "S": "COUPLE#$partnerId" },
                            ":sk": { "S": "TASK#" }
                        }
                    }
                }
            `),
            responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultList(),
        });

        // updateTask Resolver
        dataSource.createResolver('UpdateTaskResolver', {
            typeName: 'Mutation',
            fieldName: 'updateTask',
            requestMappingTemplate: appsync.MappingTemplate.fromString(`
                #set($partnerId = $ctx.arguments.input.partnerId)
                {
                    "version": "2017-02-28",
                    "operation": "UpdateItem",
                    "key": {
                        "PK": { "S": "COUPLE#$partnerId" },
                        "SK": { "S": "TASK#$ctx.arguments.input.id" }
                    },
                    "update": {
                        "expression": "SET #title = :title, #assignee = :assignee, #date = :date, #category = :category, #updatedAt = :updatedAt",
                        "expressionNames": {
                            "#title": "title",
                            "#assignee": "assignee",
                            "#date": "date",
                            "#category": "category",
                            "#updatedAt": "updatedAt"
                        },
                        "expressionValues": {
                            ":title": { "S": "$ctx.arguments.input.title" },
                            ":assignee": { "S": "$ctx.arguments.input.assignee" },
                            ":date": { "S": "$ctx.arguments.input.date" },
                            ":category": { "S": "$ctx.arguments.input.category" },
                            ":updatedAt": { "S": "$util.time.nowISO8601()" }
                        }
                    }
                }
            `),
            responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
        });

        // completeTask Resolver
        dataSource.createResolver('CompleteTaskResolver', {
            typeName: 'Mutation',
            fieldName: 'completeTask',
            requestMappingTemplate: appsync.MappingTemplate.fromString(`
                #set($partnerId = $ctx.arguments.partnerId)
                {
                    "version": "2017-02-28",
                    "operation": "UpdateItem",
                    "key": {
                        "PK": { "S": "COUPLE#$partnerId" },
                        "SK": { "S": "TASK#$ctx.arguments.taskId" }
                    },
                    "update": {
                        "expression": "SET completed = :completed, completedAt = :completedAt",
                        "expressionValues": {
                            ":completed": { "BOOL": true },
                            ":completedAt": { "S": "$util.time.nowISO8601()" }
                        }
                    }
                }
            `),
            responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
        });

        // uncompleteTask Resolver
        dataSource.createResolver('UncompleteTaskResolver', {
            typeName: 'Mutation',
            fieldName: 'uncompleteTask',
            requestMappingTemplate: appsync.MappingTemplate.fromString(`
                #set($partnerId = $ctx.arguments.partnerId)
                {
                    "version": "2017-02-28",
                    "operation": "UpdateItem",
                    "key": {
                        "PK": { "S": "COUPLE#$partnerId" },
                        "SK": { "S": "TASK#$ctx.arguments.taskId" }
                    },
                    "update": {
                        "expression": "SET completed = :completed REMOVE completedAt",
                        "expressionValues": {
                            ":completed": { "BOOL": false }
                        }
                    }
                }
            `),
            responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
        });

        // deleteTask Resolver（削除されたアイテムを返す - Subscription用）
        dataSource.createResolver('DeleteTaskResolver', {
            typeName: 'Mutation',
            fieldName: 'deleteTask',
            requestMappingTemplate: appsync.MappingTemplate.fromString(`
                #set($partnerId = $ctx.arguments.partnerId)
                {
                    "version": "2017-02-28",
                    "operation": "DeleteItem",
                    "key": {
                        "PK": { "S": "COUPLE#$partnerId" },
                        "SK": { "S": "TASK#$ctx.arguments.taskId" }
                    }
                }
            `),
            responseMappingTemplate: appsync.MappingTemplate.fromString(`
                ## 削除成功時は null を返す（スキーマで Task は nullable）
                $util.toJson(null)
            `),
        });

        // ===========================================
        // 5. VTL Resolvers（Goal CRUD）
        // ===========================================

        // createGoal Resolver
        dataSource.createResolver('CreateGoalResolver', {
            typeName: 'Mutation',
            fieldName: 'createGoal',
            requestMappingTemplate: appsync.MappingTemplate.fromString(`
                #set($partnerId = $ctx.arguments.input.partnerId)
                #set($goalId = $util.autoId())
                #set($attrs = {
                    "id": { "S": "$goalId" },
                    "partnerId": { "S": "$partnerId" },
                    "title": { "S": "$ctx.arguments.input.title" },
                    "deadline": { "S": "$ctx.arguments.input.deadline" },
                    "icon": { "S": "$ctx.arguments.input.icon" },
                    "createdBy": { "S": "$ctx.identity.sub" },
                    "createdAt": { "S": "$util.time.nowISO8601()" },
                    "achieved": { "BOOL": false }
                })
                #if($ctx.arguments.input.targetAmount)
                    $util.qr($attrs.put("targetAmount", { "N": "$ctx.arguments.input.targetAmount" }))
                #end
                #if($ctx.arguments.input.currentAmount)
                    $util.qr($attrs.put("currentAmount", { "N": "$ctx.arguments.input.currentAmount" }))
                #else
                    $util.qr($attrs.put("currentAmount", { "N": "0" }))
                #end
                {
                    "version": "2017-02-28",
                    "operation": "PutItem",
                    "key": {
                        "PK": { "S": "COUPLE#$partnerId" },
                        "SK": { "S": "GOAL#$goalId" }
                    },
                    "attributeValues": $util.toJson($attrs)
                }
            `),
            responseMappingTemplate: appsync.MappingTemplate.fromString(`
                ## achievedAtがない場合にnullを設定（新規作成時はachieved=falseなのでachievedAtはない）
                #if(!$ctx.result.containsKey("achievedAt"))
                    $util.qr($ctx.result.put("achievedAt", null))
                #end
                $util.toJson($ctx.result)
            `),
        });

        // getGoals Resolver
        dataSource.createResolver('GetGoalsResolver', {
            typeName: 'Query',
            fieldName: 'getGoals',
            requestMappingTemplate: appsync.MappingTemplate.fromString(`
                #set($partnerId = $ctx.arguments.partnerId)
                {
                    "version": "2017-02-28",
                    "operation": "Query",
                    "query": {
                        "expression": "PK = :pk AND begins_with(SK, :sk)",
                        "expressionValues": {
                            ":pk": { "S": "COUPLE#$partnerId" },
                            ":sk": { "S": "GOAL#" }
                        }
                    }
                }
            `),
            responseMappingTemplate: appsync.MappingTemplate.fromString(`
                ## 既存データにtargetAmount/currentAmount/achieved/achievedAtがない場合にnullを設定
                #set($items = [])
                #foreach($item in $ctx.result.items)
                    #if(!$item.containsKey("targetAmount"))
                        $util.qr($item.put("targetAmount", null))
                    #end
                    #if(!$item.containsKey("currentAmount"))
                        $util.qr($item.put("currentAmount", null))
                    #end
                    #if(!$item.containsKey("achieved"))
                        $util.qr($item.put("achieved", null))
                    #end
                    #if(!$item.containsKey("achievedAt"))
                        $util.qr($item.put("achievedAt", null))
                    #end
                    $util.qr($items.add($item))
                #end
                $util.toJson($items)
            `),
        });

        // updateGoal Resolver
        dataSource.createResolver('UpdateGoalResolver', {
            typeName: 'Mutation',
            fieldName: 'updateGoal',
            requestMappingTemplate: appsync.MappingTemplate.fromString(`
                #set($partnerId = $ctx.arguments.input.partnerId)
                #set($expNames = {
                    "#title": "title",
                    "#deadline": "deadline",
                    "#icon": "icon"
                })
                #set($expValues = {
                    ":title": { "S": "$ctx.arguments.input.title" },
                    ":deadline": { "S": "$ctx.arguments.input.deadline" },
                    ":icon": { "S": "$ctx.arguments.input.icon" }
                })
                #set($updateExp = "SET #title = :title, #deadline = :deadline, #icon = :icon")
                #if($ctx.arguments.input.targetAmount || $ctx.arguments.input.targetAmount == 0)
                    #set($updateExp = "$updateExp, #targetAmount = :targetAmount")
                    $util.qr($expNames.put("#targetAmount", "targetAmount"))
                    $util.qr($expValues.put(":targetAmount", { "N": "$ctx.arguments.input.targetAmount" }))
                #end
                #if($ctx.arguments.input.currentAmount || $ctx.arguments.input.currentAmount == 0)
                    #set($updateExp = "$updateExp, #currentAmount = :currentAmount")
                    $util.qr($expNames.put("#currentAmount", "currentAmount"))
                    $util.qr($expValues.put(":currentAmount", { "N": "$ctx.arguments.input.currentAmount" }))
                #end
                ## achieved フィールドの処理
                #if($ctx.arguments.input.achieved == true)
                    #set($updateExp = "$updateExp, #achieved = :achieved, #achievedAt = :achievedAt")
                    $util.qr($expNames.put("#achieved", "achieved"))
                    $util.qr($expNames.put("#achievedAt", "achievedAt"))
                    $util.qr($expValues.put(":achieved", { "BOOL": true }))
                    $util.qr($expValues.put(":achievedAt", { "S": "$util.time.nowISO8601()" }))
                #elseif($ctx.arguments.input.achieved == false)
                    #set($updateExp = "$updateExp, #achieved = :achieved REMOVE achievedAt")
                    $util.qr($expNames.put("#achieved", "achieved"))
                    $util.qr($expValues.put(":achieved", { "BOOL": false }))
                #end
                {
                    "version": "2017-02-28",
                    "operation": "UpdateItem",
                    "key": {
                        "PK": { "S": "COUPLE#$partnerId" },
                        "SK": { "S": "GOAL#$ctx.arguments.input.id" }
                    },
                    "update": {
                        "expression": "$updateExp",
                        "expressionNames": $util.toJson($expNames),
                        "expressionValues": $util.toJson($expValues)
                    }
                }
            `),
            responseMappingTemplate: appsync.MappingTemplate.fromString(`
                ## 既存データにフィールドがない場合にnullを設定
                #if(!$ctx.result.containsKey("targetAmount"))
                    $util.qr($ctx.result.put("targetAmount", null))
                #end
                #if(!$ctx.result.containsKey("currentAmount"))
                    $util.qr($ctx.result.put("currentAmount", null))
                #end
                #if(!$ctx.result.containsKey("achieved"))
                    $util.qr($ctx.result.put("achieved", null))
                #end
                #if(!$ctx.result.containsKey("achievedAt"))
                    $util.qr($ctx.result.put("achievedAt", null))
                #end
                $util.toJson($ctx.result)
            `),
        });

        // deleteGoal Resolver（削除されたアイテムを返す - Subscription用）
        dataSource.createResolver('DeleteGoalResolver', {
            typeName: 'Mutation',
            fieldName: 'deleteGoal',
            requestMappingTemplate: appsync.MappingTemplate.fromString(`
                #set($partnerId = $ctx.arguments.partnerId)
                {
                    "version": "2017-02-28",
                    "operation": "DeleteItem",
                    "key": {
                        "PK": { "S": "COUPLE#$partnerId" },
                        "SK": { "S": "GOAL#$ctx.arguments.goalId" }
                    }
                }
            `),
            responseMappingTemplate: appsync.MappingTemplate.fromString(`
                ## 削除成功時は null を返す（スキーマで Goal は nullable）
                $util.toJson(null)
            `),
        });

        // ===========================================
        // 6. VTL Resolvers（Timeline）
        // ===========================================

        // getTimeline Resolver
        dataSource.createResolver('GetTimelineResolver', {
            typeName: 'Query',
            fieldName: 'getTimeline',
            requestMappingTemplate: appsync.MappingTemplate.fromString(`
                #set($partnerId = $ctx.arguments.partnerId)
                {
                    "version": "2017-02-28",
                    "operation": "Query",
                    "query": {
                        "expression": "PK = :pk AND begins_with(SK, :sk)",
                        "expressionValues": {
                            ":pk": { "S": "COUPLE#$partnerId" },
                            ":sk": { "S": "TIMELINE#" }
                        }
                    },
                    "scanIndexForward": false,
                    "limit": $util.defaultIfNull($ctx.arguments.limit, 50)
                }
            `),
            responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultList(),
        });

        // ===========================================
        // 7. VTL Resolvers（Stamp）
        // ===========================================

        // sendStamp Resolver
        dataSource.createResolver('SendStampResolver', {
            typeName: 'Mutation',
            fieldName: 'sendStamp',
            requestMappingTemplate: appsync.MappingTemplate.fromString(`
                #set($partnerId = $ctx.arguments.input.partnerId)
                #set($stampId = $util.autoId())
                #set($timestamp = $util.time.nowISO8601())
                #set($attrs = {
                    "id": { "S": "$stampId" },
                    "from": { "S": "$ctx.identity.sub" },
                    "to": { "S": "$ctx.arguments.input.to" },
                    "stampType": { "S": "$ctx.arguments.input.stampType" },
                    "timestamp": { "S": "$timestamp" }
                })
                #if($ctx.arguments.input.taskId)
                    $util.qr($attrs.put("taskId", { "S": "$ctx.arguments.input.taskId" }))
                #end
                {
                    "version": "2017-02-28",
                    "operation": "PutItem",
                    "key": {
                        "PK": { "S": "COUPLE#$partnerId" },
                        "SK": { "S": "STAMP#$timestamp#$stampId" }
                    },
                    "attributeValues": $util.toJson($attrs)
                }
            `),
            responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
        });

        // getStamps Resolver - スタンプ一覧を取得
        dataSource.createResolver('GetStampsResolver', {
            typeName: 'Query',
            fieldName: 'getStamps',
            requestMappingTemplate: appsync.MappingTemplate.fromString(`
                #set($partnerId = $ctx.arguments.partnerId)
                {
                    "version": "2017-02-28",
                    "operation": "Query",
                    "query": {
                        "expression": "PK = :pk AND begins_with(SK, :sk)",
                        "expressionValues": {
                            ":pk": { "S": "COUPLE#$partnerId" },
                            ":sk": { "S": "STAMP#" }
                        }
                    },
                    "scanIndexForward": false,
                    "limit": $util.defaultIfNull($ctx.arguments.limit, 500)
                }
            `),
            responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultList(),
        });

        // getStampStats Resolver
        dataSource.createResolver('GetStampStatsResolver', {
            typeName: 'Query',
            fieldName: 'getStampStats',
            requestMappingTemplate: appsync.MappingTemplate.fromString(`
                #set($partnerId = $ctx.arguments.partnerId)
                {
                    "version": "2017-02-28",
                    "operation": "GetItem",
                    "key": {
                        "PK": { "S": "COUPLE#$partnerId" },
                        "SK": { "S": "COUPLE#METADATA" }
                    }
                }
            `),
            responseMappingTemplate: appsync.MappingTemplate.fromString(`
                #if($ctx.result)
                    $util.toJson($ctx.result.totalStamps)
                #else
                    $util.toJson({
                        "love": 0,
                        "thanks": 0,
                        "star": 0,
                        "muscle": 0,
                        "sparkle": 0,
                        "heart": 0
                    })
                #end
            `),
        });

        // ===========================================
        // 8. Lambda Resolvers（createInviteCode, joinCouple）
        // ===========================================

        // createInviteCode Lambda
        const createInviteCodeFn = new lambda.Function(this, 'CreateInviteCodeFunction', {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'create-invite-code.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
            environment: {
                TABLE_NAME: this.table.tableName,
                USER_POOL_ID: userPool.userPoolId,
            },
            timeout: cdk.Duration.seconds(10),
        });
        this.table.grantReadWriteData(createInviteCodeFn);

        // Cognito 読み取り権限を付与
        createInviteCodeFn.addToRolePolicy(new iam.PolicyStatement({
            actions: ['cognito-idp:AdminGetUser'],
            resources: [userPool.userPoolArn],
        }));

        // joinCouple Lambda
        const joinCoupleFn = new lambda.Function(this, 'JoinCoupleFunction', {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'join-couple.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
            environment: {
                TABLE_NAME: this.table.tableName,
                USER_POOL_ID: userPool.userPoolId,
            },
            timeout: cdk.Duration.seconds(10),
        });
        this.table.grantReadWriteData(joinCoupleFn);

        // Cognito 読み取り・更新権限を付与
        joinCoupleFn.addToRolePolicy(new iam.PolicyStatement({
            actions: ['cognito-idp:AdminGetUser', 'cognito-idp:AdminUpdateUserAttributes'],
            resources: [userPool.userPoolArn],
        }));

        // deleteAccount Lambda
        const deleteAccountFn = new lambda.Function(this, 'DeleteAccountFunction', {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'delete-account.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
            environment: {
                TABLE_NAME: this.table.tableName,
                USER_POOL_ID: userPool.userPoolId,
            },
            timeout: cdk.Duration.seconds(30), // 削除処理は時間がかかる可能性
        });
        this.table.grantReadWriteData(deleteAccountFn);

        // Cognito 削除権限を付与
        deleteAccountFn.addToRolePolicy(new iam.PolicyStatement({
            actions: ['cognito-idp:AdminDeleteUser'],
            resources: [userPool.userPoolArn],
        }));

        // Lambda データソース
        const createInviteCodeDs = this.api.addLambdaDataSource(
            'CreateInviteCodeDataSource',
            createInviteCodeFn
        );

        const joinCoupleDs = this.api.addLambdaDataSource(
            'JoinCoupleDataSource',
            joinCoupleFn
        );

        const deleteAccountDs = this.api.addLambdaDataSource(
            'DeleteAccountDataSource',
            deleteAccountFn
        );

        // createInviteCode Resolver
        createInviteCodeDs.createResolver('CreateInviteCodeResolver', {
            typeName: 'Mutation',
            fieldName: 'createInviteCode',
        });

        // joinCouple Resolver
        joinCoupleDs.createResolver('JoinCoupleResolver', {
            typeName: 'Mutation',
            fieldName: 'joinCouple',
        });

        // deleteAccount Resolver
        deleteAccountDs.createResolver('DeleteAccountResolver', {
            typeName: 'Mutation',
            fieldName: 'deleteAccount',
        });

        // getMe Lambda - Cognito からユーザー属性を取得
        const getMeFn = new lambda.Function(this, 'GetMeFunction', {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'get-me.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
            environment: {
                USER_POOL_ID: userPool.userPoolId,
            },
            timeout: cdk.Duration.seconds(10),
        });

        // Cognito 読み取り権限を付与
        getMeFn.addToRolePolicy(new iam.PolicyStatement({
            actions: ['cognito-idp:AdminGetUser'],
            resources: [userPool.userPoolArn],
        }));

        const getMeDs = this.api.addLambdaDataSource(
            'GetMeDataSource',
            getMeFn
        );

        // getMe Resolver
        getMeDs.createResolver('GetMeResolver', {
            typeName: 'Query',
            fieldName: 'getMe',
        });

        // updateUser Lambda - Cognito と DynamoDB の両方を更新
        const updateUserFn = new lambda.Function(this, 'UpdateUserFunction', {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'update-user.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
            environment: {
                TABLE_NAME: this.table.tableName,
                USER_POOL_ID: userPool.userPoolId,
            },
            timeout: cdk.Duration.seconds(10),
        });
        this.table.grantReadWriteData(updateUserFn);

        // Cognito 読み取り・更新権限を付与
        updateUserFn.addToRolePolicy(new iam.PolicyStatement({
            actions: ['cognito-idp:AdminGetUser', 'cognito-idp:AdminUpdateUserAttributes'],
            resources: [userPool.userPoolArn],
        }));

        const updateUserDs = this.api.addLambdaDataSource(
            'UpdateUserDataSource',
            updateUserFn
        );

        // updateUser Resolver
        updateUserDs.createResolver('UpdateUserResolver', {
            typeName: 'Mutation',
            fieldName: 'updateUser',
        });

        // ===========================================
        // Tags
        // ===========================================
        cdk.Tags.of(this).add('Project', 'futarinote');
        cdk.Tags.of(this).add('Environment', environment);

        // ===========================================
        // Outputs
        // ===========================================
        new cdk.CfnOutput(this, 'GraphQLApiEndpoint', {
            value: this.api.graphqlUrl,
            description: 'GraphQL API Endpoint',
            exportName: `${environment}-GraphQLApiEndpoint`,
        });

        new cdk.CfnOutput(this, 'GraphQLApiId', {
            value: this.api.apiId,
            description: 'GraphQL API ID',
            exportName: `${environment}-GraphQLApiId`,
        });

        new cdk.CfnOutput(this, 'TableName', {
            value: this.table.tableName,
            description: 'DynamoDB Table Name',
            exportName: `${environment}-TableName`,
        });
    }
}
