import credentialService from '../services/credentialService.js';

export const createCredential = async (req, res, next) => {
  try {
    const credential = await credentialService.createCredential(req.params.projectId, req.body, req.user._id);
    res.status(201).json({
      status: 'success',
      data: { credential }
    });
  } catch (error) {
    next(error);
  }
};

export const getCredentialsForProject = async (req, res, next) => {
  try {
    const credentials = await credentialService.getCredentialsForProject(req.params.projectId, req.user);
    res.status(200).json({
      status: 'success',
      results: credentials.length,
      data: { credentials }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCredential = async (req, res, next) => {
  try {
    const result = await credentialService.deleteCredential(req.params.id, req.user);
    res.status(200).json({
      status: 'success',
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};
