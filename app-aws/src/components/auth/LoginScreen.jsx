import { Authenticator, useTheme, View, Image, Text, Heading } from '@aws-amplify/ui-react';
import { I18n } from 'aws-amplify/utils';
import '@aws-amplify/ui-react/styles.css';
import './LoginScreen.css';

// 日本語翻訳を設定
I18n.putVocabularies({
  ja: {
    // サインイン
    'Sign In': 'ログイン',
    'Sign in': 'ログイン',
    'Sign in to your account': 'アカウントにログイン',
    'Signing in': 'ログイン中...',
    'Email': 'メールアドレス',
    'Enter your Email': 'メールアドレスを入力',
    'Password': 'パスワード',
    'Enter your Password': 'パスワードを入力',
    'Forgot your password?': 'パスワードをお忘れですか？',

    // サインアップ
    'Sign Up': 'アカウント作成',
    'Create Account': 'アカウント作成',
    'Create a new account': '新規アカウント作成',
    'Creating Account': '作成中...',
    'Confirm Password': 'パスワード（確認）',
    'Please confirm your Password': 'パスワードを再入力',
    'Name': 'お名前',
    'Enter your Name': 'ニックネームを入力',

    // 確認コード
    'Confirm Sign Up': '確認コード入力',
    'Confirmation Code': '確認コード',
    'Enter your Confirmation Code': '確認コードを入力',
    'Confirm': '確認',
    'Confirming': '確認中...',
    'Resend Code': 'コードを再送信',
    'Back to Sign In': 'ログインに戻る',

    // パスワードリセット
    'Reset Password': 'パスワードリセット',
    'Reset your password': 'パスワードをリセット',
    'Send code': 'コードを送信',
    'Sending': '送信中...',
    'Submit': '送信',
    'Submitting': '送信中...',
    'New Password': '新しいパスワード',
    'Enter your new password': '新しいパスワードを入力',
    'Code': 'コード',

    // ソーシャルログイン
    'Sign In with Google': 'Googleでログイン',
    'Sign Up with Google': 'Googleで登録',
    'or': 'または',

    // エラーメッセージ
    'User does not exist.': 'ユーザーが見つかりません',
    'Incorrect username or password.': 'メールアドレスまたはパスワードが正しくありません',
    'User already exists': 'このメールアドレスは既に登録されています',
    'Invalid password format': 'パスワードの形式が正しくありません',
    'Password must have at least 8 characters': 'パスワードは8文字以上必要です',
    'Your passwords must match': 'パスワードが一致しません',
    'Invalid verification code provided, please try again.': '確認コードが正しくありません',
    'Username cannot be empty': 'メールアドレスを入力してください',
    'Password cannot be empty': 'パスワードを入力してください',
    'An account with the given email already exists.': 'このメールアドレスは既に登録されています',
  },
});
I18n.setLanguage('ja');

// カスタムヘッダーコンポーネント
const components = {
  Header() {
    const { tokens } = useTheme();
    return (
      <View textAlign="center" padding={tokens.space.large}>
        <div className="login-logo">💑</div>
        <Heading level={3} className="login-title">
          ふたりノート
        </Heading>
        <Text className="login-subtitle">
          カップル向けタスク管理＆感謝共有アプリ
        </Text>
      </View>
    );
  },
  Footer() {
    return (
      <View textAlign="center" padding="1rem">
        <Text className="login-footer">
          © 2024 ふたりノート
        </Text>
      </View>
    );
  },
};

/**
 * LoginScreen - Google OAuth ログイン画面
 *
 * Amplify UI Authenticator を使用してログインUIを提供
 * - Google OAuth 2.0 によるソーシャルログイン
 * - 日本語対応
 */
const LoginScreen = ({ children }) => {
  return (
    <Authenticator
      socialProviders={['google']}
      loginMechanisms={['email']}
      signUpAttributes={['email', 'name']}
      components={components}
      formFields={{
        signIn: {
          username: {
            label: 'メールアドレス',
            placeholder: 'example@example.com',
          },
          password: {
            label: 'パスワード',
            placeholder: 'パスワードを入力',
          },
        },
        signUp: {
          email: {
            label: 'メールアドレス',
            placeholder: 'example@example.com',
            isRequired: true,
            order: 1,
          },
          name: {
            label: 'ニックネーム',
            placeholder: 'ニックネームを入力',
            isRequired: false,
            order: 2,
          },
          password: {
            label: 'パスワード',
            placeholder: '8文字以上で入力',
            isRequired: true,
            order: 3,
          },
          confirm_password: {
            label: 'パスワード（確認）',
            placeholder: 'パスワードを再入力',
            order: 4,
          },
        },
        forgotPassword: {
          username: {
            label: 'メールアドレス',
            placeholder: '登録したメールアドレスを入力',
          },
        },
        confirmResetPassword: {
          confirmation_code: {
            label: '確認コード',
            placeholder: 'メールに届いたコードを入力',
          },
          password: {
            label: '新しいパスワード',
            placeholder: '8文字以上で入力',
          },
          confirm_password: {
            label: '新しいパスワード（確認）',
            placeholder: 'パスワードを再入力',
          },
        },
      }}
    >
      {({ signOut, user }) => children({ signOut, user })}
    </Authenticator>
  );
};

export default LoginScreen;
