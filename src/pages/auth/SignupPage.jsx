import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { signupApi, checkEmailDuplicationApi } from '../../api/auth';
import styles from './LoginPage.module.css';
import logo from '../../assets/icons/logo.png';
import eyeIcon from '../../assets/icons/eye.svg';
import eyeSlashIcon from '../../assets/icons/eye-slash.svg';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app/dashboard');
    }
  }, [navigate, isAuthenticated]);

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

  const validateForm = async () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다';
    } else {
      try {
        const isDuplicate = await checkEmailDuplicationApi(formData.email);
        if (isDuplicate) {
          newErrors.email = '이미 사용 중인 이메일입니다';
        }
      } catch (error) {
        console.error('이메일 중복 확인 오류:', error);
      }
    }
    
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요';
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 6자 이상이어야 합니다';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요';
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    }
    
    if (!agreeToTerms) {
      newErrors.terms = '회원 가입 약관에 모두 동의합니다';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isValid = await validateForm();
    if (!isValid) return;
    
    try {
      await signupApi(formData);
      navigate('/auth/login', { state: { message: '회원가입이 완료되었습니다. 로그인해주세요.' } });
    } catch (error) {
      console.error('회원가입 오류:', error);
      setErrors({ form: error.message || '회원가입 중 오류가 발생했습니다' });
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else if (field === 'confirmPassword') {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logoContainer}>
          <img src={logo} alt="" className={styles.logo} />
        </div>
        
        <h2 className={styles.title}>이메일로 가입하기</h2>
        
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">이메일주소 (ID)</label>
            <div className={styles.emailInput}>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="6자 이상"
              />
              <button type="button" className={styles.verifyButton}>인증</button>
            </div>
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
                placeholder="6자 이상"
              />
              <button 
                type="button" 
                className={styles.passwordToggle}
                onClick={() => togglePasswordVisibility('password')}
              >
                {showPassword ? <img src={eyeSlashIcon} alt="숨기기" /> : <img src={eyeIcon} alt="보기" />}
              </button>
            </div>
            {errors.password && <p className={styles.errorText}>{errors.password}</p>}
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">비밀번호 확인</label>
            <div className={styles.passwordInput}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="6자 이상"
              />
              <button 
                type="button" 
                className={styles.passwordToggle}
                onClick={() => togglePasswordVisibility('confirmPassword')}
              >
                {showConfirmPassword ? <img src={eyeSlashIcon} alt="숨기기" /> : <img src={eyeIcon} alt="보기" />}
              </button>
            </div>
            {errors.confirmPassword && <p className={styles.errorText}>{errors.confirmPassword}</p>}
          </div>
          
          <div className={styles.terms}>
            <div className={styles.checkbox}>
              <input
                type="checkbox"
                id="agreeToTerms"
                checked={agreeToTerms}
                onChange={() => setAgreeToTerms(!agreeToTerms)}
              />
              <label htmlFor="agreeToTerms">회원 가입 약관에 모두 동의합니다</label>
              <a href="#" className={styles.termsLink}>확인하기</a>
            </div>
            {errors.terms && <p className={styles.errorText}>{errors.terms}</p>}
          </div>
          
          <div className={styles.buttonGroup}>
            <button type="button" className={styles.loginButton} onClick={() => navigate('/auth/login')}>이전</button>
            <button type="submit" className={styles.loginButton}>다음</button>
          </div>
        </form>
        
        {errors.form && (
          <div className={styles.formError}>
            {errors.form}
          </div>
        )}
      </div>
    </div>
  );
};

export default SignupPage; 