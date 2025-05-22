import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './LoginPage.module.css';
import logo from '../../assets/icons/logo.png';
import eyeIcon from '../../assets/icons/eye.svg';
import eyeSlashIcon from '../../assets/icons/eye-slash.svg';
import kakaoIcon from '../../assets/icons/kakao.svg';
import googleIcon from '../../assets/icons/google.svg';
import naverIcon from '../../assets/icons/naver.svg';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 에러 상태 초기화
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요';
    }
    
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const success = await login(formData.email, formData.password);
      if (success) {
        if (keepLoggedIn) {
          localStorage.setItem('rememberEmail', formData.email);
        }
        navigate('/app/dashboard');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      setErrors({ form: error.message || '오류가 발생했습니다' });
    }
  };

  const handleSocialLogin = (provider) => {
    console.log(`${provider} 로그인`);
    // 소셜 로그인 구현
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logoContainer}>
          <img src={logo} alt="" className={styles.logo} />
        </div>
        
        <h2 className={styles.title}>로그인</h2>
        
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">이메일주소 (ID)</label>
            <input
              type="text"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="아이디 입력"
            />
            {errors.email && <p className={styles.errorText}>{errors.email}</p>}
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="password">비밀번호</label>
            <div className={styles.passwordInput}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="비밀번호 입력"
              />
              <button 
                type="button" 
                className={styles.passwordToggle}
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <img src={eyeSlashIcon} alt="숨기기" /> : <img src={eyeIcon} alt="보기" />}
              </button>
            </div>
            {errors.password && <p className={styles.errorText}>{errors.password}</p>}
          </div>
          
          <div className={styles.loginOptions}>
            <div className={styles.checkbox}>
              <input
                type="checkbox"
                id="keepLoggedIn"
                checked={keepLoggedIn}
                onChange={() => setKeepLoggedIn(!keepLoggedIn)}
              />
              <label htmlFor="keepLoggedIn">로그인 유지</label>
            </div>
            <button type="button" className={styles.forgotPassword}>비밀번호 찾기 &gt;</button>
          </div>
          
          <button type="submit" className={styles.loginButton}>로그인</button>
        </form>
        
        <div className={styles.divider}>
          <span>또는</span>
        </div>
        
        <div className={styles.social}>
          <p>SNS 계정으로 3초만에 가입하기</p>
          <div className={styles.socialButtons}>
            <button 
              type="button"
              className={styles.socialButton} 
              onClick={() => handleSocialLogin('kakao')}
            >
              <img src={kakaoIcon} alt="카카오" />
            </button>
            
            <button 
              type="button"
              className={styles.socialButton} 
              onClick={() => handleSocialLogin('google')}
            >
              <img src={googleIcon} alt="구글" />
            </button>
            
            <button 
              type="button"
              className={styles.socialButton} 
              onClick={() => handleSocialLogin('naver')}
            >
              <img src={naverIcon} alt="네이버" />
            </button>
          </div>
        </div>
        
        <Link to="/auth/signup" className={styles.emailSignupLink}>
          <button className={styles.emailSignupButton}>이메일로 가입하기</button>
        </Link>
      </div>
      
      {errors.form && (
        <div className={styles.formError}>
          {errors.form}
        </div>
      )}
    </div>
  );
};

export default LoginPage; 