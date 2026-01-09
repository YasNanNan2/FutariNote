import * as cdk from 'aws-cdk-lib/core';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface AuthStackProps extends cdk.StackProps {
    readonly environment: 'dev' | 'prod';
}

/**
 * AuthStack - Cognito User Pool と Google Identity Provider を管理
 */
export class AuthStack extends cdk.Stack {
    public readonly userPool: cognito.UserPool;
    public readonly userPoolClient: cognito.UserPoolClient;
    public readonly userPoolDomain: cognito.UserPoolDomain;

    constructor(scope: Construct, id: string, props: AuthStackProps) {
        super(scope, id, props);

        const { environment } = props;

        // ===========================================
        // 1. Cognito User Pool
        // ===========================================
        this.userPool = new cognito.UserPool(this, 'UserPool', {
            userPoolName: `futarinote-${environment}-userpool`,

            // サインイン設定
            signInAliases: {
                email: true,
            },

            // セルフサインアップ許可（Google OAuth 用）
            selfSignUpEnabled: true,

            // メール検証
            autoVerify: {
                email: true,
            },

            // 標準属性
            standardAttributes: {
                email: {
                    required: true,
                    mutable: true,
                },
                fullname: {
                    required: false,
                    mutable: true,
                },
            },

            // カスタム属性
            customAttributes: {
                partnerId: new cognito.StringAttribute({
                    mutable: true,
                }),
                color: new cognito.StringAttribute({
                    mutable: true,
                }),
            },

            // パスワードポリシー
            passwordPolicy: {
                minLength: 8,
                requireLowercase: true,
                requireUppercase: false,
                requireDigits: true,
                requireSymbols: false,
            },

            // アカウント復旧
            accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,

            // ユーザー削除保護（本番環境のみ）
            deletionProtection: environment === 'prod',

            // 削除時の挙動
            removalPolicy: environment === 'prod'
                ? cdk.RemovalPolicy.RETAIN
                : cdk.RemovalPolicy.DESTROY,
        });

        // ===========================================
        // 2. Google Identity Provider
        // ===========================================
        // 注意: クライアントID/シークレットは環境変数またはSecrets Managerから取得
        // デプロイ時に以下の環境変数を設定してください:
        //   GOOGLE_CLIENT_ID
        //   GOOGLE_CLIENT_SECRET

        const googleClientId = process.env.GOOGLE_CLIENT_ID;
        const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

        if (googleClientId && googleClientSecret) {
            const googleProvider = new cognito.UserPoolIdentityProviderGoogle(this, 'GoogleProvider', {
                userPool: this.userPool,
                clientId: googleClientId,
                clientSecretValue: cdk.SecretValue.unsafePlainText(googleClientSecret),

                // スコープ
                scopes: ['profile', 'email', 'openid'],

                // 属性マッピング
                attributeMapping: {
                    email: cognito.ProviderAttribute.GOOGLE_EMAIL,
                    fullname: cognito.ProviderAttribute.GOOGLE_NAME,
                    profilePicture: cognito.ProviderAttribute.GOOGLE_PICTURE,
                },
            });

            // ===========================================
            // 3. User Pool Client (Google Provider 依存)
            // ===========================================
            this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
                userPool: this.userPool,
                userPoolClientName: `futarinote-${environment}-client`,

                // 認証フロー
                authFlows: {
                    userSrp: true,
                    userPassword: false,
                },

                // OAuth 設定
                oAuth: {
                    flows: {
                        authorizationCodeGrant: true,
                        implicitCodeGrant: false,
                    },
                    scopes: [
                        cognito.OAuthScope.EMAIL,
                        cognito.OAuthScope.OPENID,
                        cognito.OAuthScope.PROFILE,
                        cognito.OAuthScope.COGNITO_ADMIN, // カスタム属性の読み書きに必要
                    ],
                    callbackUrls: environment === 'prod'
                        ? ['https://futarinote.example.com/'] // TODO: 本番URL
                        : ['http://localhost:5173/', 'http://localhost:3000/', 'https://d3fxuueke57xsi.cloudfront.net/'],
                    logoutUrls: environment === 'prod'
                        ? ['https://futarinote.example.com/']
                        : ['http://localhost:5173/', 'http://localhost:3000/', 'https://d3fxuueke57xsi.cloudfront.net/'],
                },

                // サポートする IdP
                supportedIdentityProviders: [
                    cognito.UserPoolClientIdentityProvider.GOOGLE,
                    cognito.UserPoolClientIdentityProvider.COGNITO,
                ],

                // カスタム属性をトークンに含める
                readAttributes: new cognito.ClientAttributes()
                    .withStandardAttributes({ email: true, givenName: true, familyName: true })
                    .withCustomAttributes('partnerId', 'color'),

                // トークン有効期限
                accessTokenValidity: cdk.Duration.hours(1),
                idTokenValidity: cdk.Duration.hours(1),
                refreshTokenValidity: cdk.Duration.days(30),

            });

            // 依存関係を明示
            this.userPoolClient.node.addDependency(googleProvider);
        } else {
            // Google 認証情報がない場合は Cognito のみで作成
            this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
                userPool: this.userPool,
                userPoolClientName: `futarinote-${environment}-client`,
                authFlows: {
                    userSrp: true,
                    userPassword: false,
                },
                oAuth: {
                    flows: {
                        authorizationCodeGrant: true,
                    },
                    scopes: [
                        cognito.OAuthScope.EMAIL,
                        cognito.OAuthScope.OPENID,
                        cognito.OAuthScope.PROFILE,
                        cognito.OAuthScope.COGNITO_ADMIN, // カスタム属性の読み書きに必要
                    ],
                    callbackUrls: ['http://localhost:5173/', 'http://localhost:3000/', 'https://d3fxuueke57xsi.cloudfront.net/'],
                    logoutUrls: ['http://localhost:5173/', 'http://localhost:3000/', 'https://d3fxuueke57xsi.cloudfront.net/'],
                },
                supportedIdentityProviders: [
                    cognito.UserPoolClientIdentityProvider.COGNITO,
                ],
                // カスタム属性をトークンに含める
                readAttributes: new cognito.ClientAttributes()
                    .withStandardAttributes({ email: true, givenName: true, familyName: true })
                    .withCustomAttributes('partnerId', 'color'),
            });

            // 警告を出力
            new cdk.CfnOutput(this, 'GoogleProviderWarning', {
                value: 'Google Provider not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.',
            });
        }

        // ===========================================
        // 4. Hosted UI Domain
        // ===========================================
        this.userPoolDomain = new cognito.UserPoolDomain(this, 'UserPoolDomain', {
            userPool: this.userPool,
            cognitoDomain: {
                domainPrefix: `futarinote-${environment}`,
            },
        });

        // ===========================================
        // Tags
        // ===========================================
        cdk.Tags.of(this).add('Project', 'futarinote');
        cdk.Tags.of(this).add('Environment', environment);

        // ===========================================
        // Outputs
        // ===========================================
        new cdk.CfnOutput(this, 'UserPoolId', {
            value: this.userPool.userPoolId,
            description: 'Cognito User Pool ID',
            exportName: `${environment}-UserPoolId`,
        });

        new cdk.CfnOutput(this, 'UserPoolClientId', {
            value: this.userPoolClient.userPoolClientId,
            description: 'Cognito User Pool Client ID',
            exportName: `${environment}-UserPoolClientId`,
        });

        new cdk.CfnOutput(this, 'UserPoolDomainUrl', {
            value: `https://${this.userPoolDomain.domainName}.auth.${this.region}.amazoncognito.com`,
            description: 'Cognito Hosted UI Domain URL',
            exportName: `${environment}-UserPoolDomainUrl`,
        });

        new cdk.CfnOutput(this, 'GoogleRedirectUri', {
            value: `https://${this.userPoolDomain.domainName}.auth.${this.region}.amazoncognito.com/oauth2/idpresponse`,
            description: 'Add this URL to Google OAuth Authorized redirect URIs',
        });
    }
}
