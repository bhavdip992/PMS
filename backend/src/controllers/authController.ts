import authService from '../services/authService.js';
import User from '../models/user.js';
import { AppError } from '../utils/appError.js';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export const register = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.register(req.body);
    
    res.cookie('refreshToken', refreshToken, cookieOptions);
    
    res.status(201).json({
      status: 'success',
      data: { user, accessToken, refreshToken }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.login(
      email, 
      password, 
      req.deviceInfo, 
      req.deviceInfo?.ipAddress || req.ip, 
      req.headers['user-agent']
    );

    res.cookie('refreshToken', refreshToken, cookieOptions);

    res.status(200).json({
      status: 'success',
      data: { user, accessToken, refreshToken }
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    const { accessToken, refreshToken: newRefreshToken, user } = await authService.refresh(
      token, 
      req.deviceInfo?.ipAddress || req.ip, 
      req.headers['user-agent']
    );

    res.cookie('refreshToken', newRefreshToken, cookieOptions);

    res.status(200).json({
      status: 'success',
      data: { accessToken, refreshToken: newRefreshToken, user }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    await authService.logout(token);

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const logoutAllDevices = async (req, res, next) => {
  try {
    await authService.logoutAll(req.user._id);
    
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const
    });

    res.status(200).json({
      status: 'success',
      message: 'Logged out from all devices successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.email);
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req.params.token, req.body.password);
    res.status(200).json({
      status: 'success',
      message: 'Password reset successfully!'
    });
  } catch (error) {
    next(error);
  }
};

export const getActiveSessions = async (req, res, next) => {
  try {
    const sessions = await authService.getActiveSessions(req.user._id);
    res.status(200).json({
      status: 'success',
      data: { sessions }
    });
  } catch (error) {
    next(error);
  }
};

export const revokeSession = async (req, res, next) => {
  try {
    await authService.revokeSession(req.user._id, req.params.sessionId);
    res.status(200).json({
      status: 'success',
      message: 'Session revoked successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      status: 'success',
      data: { user: req.user }
    });
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { name, timezone, department, avatar, notificationPreferences, password, metadata } = req.body;

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (name) user.name = name;
    if (timezone) user.timezone = timezone;
    if (department) user.department = department;
    if (avatar !== undefined) user.avatar = avatar;
    if (notificationPreferences) {
      user.notificationPreferences = {
        ...user.notificationPreferences,
        ...notificationPreferences
      };
    }
    if (metadata) {
      user.metadata = {
        ...user.metadata,
        ...metadata
      };
    }
    if (password) {
      if (password.length < 6) {
        return next(new AppError('Password must be at least 6 characters', 400));
      }
      user.password = password;
    }

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      status: 'success',
      data: { user: userResponse }
    });
  } catch (error) {
    next(error);
  }
};
