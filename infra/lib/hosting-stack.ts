import * as cdk from 'aws-cdk-lib/core';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';

export interface HostingStackProps extends cdk.StackProps {
    readonly environment: 'dev' | 'prod';
}

/**
 * HostingStack - S3 と CloudFront によるフロントエンドホスティング
 */
export class HostingStack extends cdk.Stack {
    public readonly bucketName: string;
    public readonly distributionId: string;
    public readonly distributionDomainName: string;

    constructor(scope: Construct, id: string, props: HostingStackProps) {
        super(scope, id, props);

        const { environment } = props;

        // S3 バケット作成（静的ウェブホスティング用）
        const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
            bucketName: `futarinote-${environment}-website-${this.account}`,
            // CloudFront OAC を使用するため、パブリックアクセスは不要
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            // 環境に応じた削除ポリシー
            removalPolicy: environment === 'prod'
                ? cdk.RemovalPolicy.RETAIN
                : cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: environment !== 'prod',
            // CORS 設定（開発時のローカルテスト用）
            cors: environment === 'dev' ? [
                {
                    allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
                    allowedOrigins: ['http://localhost:5173', 'http://localhost:5174'],
                    allowedHeaders: ['*'],
                },
            ] : undefined,
        });

        // CloudFront ディストリビューション作成（OAC 使用）
        const distribution = new cloudfront.Distribution(this, 'Distribution', {
            defaultBehavior: {
                origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
                // SPA 用に全てのリクエストを許可
                allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
            },
            defaultRootObject: 'index.html',
            // SPA ルーティング対応（404 を index.html にリダイレクト）
            errorResponses: [
                {
                    httpStatus: 403,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                    ttl: cdk.Duration.minutes(5),
                },
                {
                    httpStatus: 404,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                    ttl: cdk.Duration.minutes(5),
                },
            ],
            // 価格クラス（日本向けなので PriceClass_200 で十分）
            priceClass: cloudfront.PriceClass.PRICE_CLASS_200,
            comment: `futarinote-${environment} frontend`,
        });

        // 出力値を保存
        this.bucketName = websiteBucket.bucketName;
        this.distributionId = distribution.distributionId;
        this.distributionDomainName = distribution.distributionDomainName;

        // CloudFormation 出力
        new cdk.CfnOutput(this, 'BucketName', {
            value: websiteBucket.bucketName,
            description: 'S3 bucket name for frontend hosting',
        });

        new cdk.CfnOutput(this, 'DistributionId', {
            value: distribution.distributionId,
            description: 'CloudFront distribution ID',
        });

        new cdk.CfnOutput(this, 'DistributionDomainName', {
            value: distribution.distributionDomainName,
            description: 'CloudFront distribution domain name',
        });

        new cdk.CfnOutput(this, 'WebsiteUrl', {
            value: `https://${distribution.distributionDomainName}`,
            description: 'Website URL',
        });

        // タグ設定
        cdk.Tags.of(this).add('Project', 'futarinote');
        cdk.Tags.of(this).add('Environment', environment);
    }
}
