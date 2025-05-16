import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { ResponseHandler } from '../helpers/ResponseHandler';
import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';
import { validate } from 'class-validator';
import { instanceToPlain } from 'class-transformer';
import { LeaveRequest } from '../entity/LeaveRequest';
import { User } from '../entity/User';

export class LeaveRequestController {
  private leaveRequestRepository: Repository<LeaveRequest>;
  private userRepository: Repository<User>;

  constructor() {
    this.leaveRequestRepository = AppDataSource.getRepository(LeaveRequest);
    this.userRepository = AppDataSource.getRepository(User);
  }

  private changeLeaveBalance = async (userID: number, amount: number) => {
    try {
      let user = await this.userRepository.findOne({
        where: { userID: userID },
      });
      if (!user) {
        throw new Error('Could not find user.');
      }
      user.annualLeaveBalance = user.annualLeaveBalance + amount;

      user = await this.userRepository.save(user);
    } catch (err) {
      throw new Error(
        `Unexpected error when changing balance for user: ${userID} by ${amount}`
      );
    }
  };

  private calculateLength = (startDate, endDate): number => {
    const MSPERDAY = 86400000;
    return (
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / MSPERDAY +
      1
    );
  };

  public addLeave = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        userID,
        startDate,
        endDate,
        leaveType = 'Annual Leave',
        reason = '',
      } = req.body;

      let leaveReq = new LeaveRequest();
      leaveReq.userID = userID;
      leaveReq.startDate = new Date(startDate);
      leaveReq.endDate = new Date(endDate);
      leaveReq.leaveType = leaveType;
      leaveReq.reason = reason;
      leaveReq.status = 'Pending';

      const errors = await validate(leaveReq);
      if (errors.length > 0) {
        throw new Error(
          errors.map((err) => Object.values(err.constraints || {})).join(', ')
        );
      }

      if (startDate > endDate) {
        throw new Error(
          `End date: ${leaveReq.endDate} is before Start date: ${leaveReq.startDate}`
        );
      }

      const user = await this.userRepository.findOne({ where: { userID } });
      if (!user) {
        throw new Error('User not found.');
      }

      const leaveLength = this.calculateLength(startDate, endDate);

      const userBalance = user.annualLeaveBalance;

      if (leaveLength > userBalance) {
        throw new Error(
          `Leave length (${leaveLength}) exceeds employee balance (${userBalance})`
        );
      }

      const overlap = await this.leaveRequestRepository
        .createQueryBuilder('leaveReq')
        .where('leaveReq.userID = :userID', { userID })
        .andWhere(':start <= leaveReq.endDate AND :end >= leaveReq.startDate', {
          start: startDate,
          end: endDate,
        })
        .getOne();
      if (overlap) {
        throw new Error(
          `Dates overlap with existing request (ID: ${overlap.leaveRequestID})`
        );
      }

      leaveReq = await this.leaveRequestRepository.save(leaveReq);
      ResponseHandler.sendSuccessResponse(
        res,
        instanceToPlain(leaveReq),
        StatusCodes.CREATED
      );
    } catch (error: any) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        error.message
      );
    }
  };

  public cancelLeave = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userID, leaveRequestID } = req.body;

      if (!userID) {
        throw new Error('No userID Provided!');
      }

      if (!leaveRequestID) {
        throw new Error('No leaveRequestID Provided!');
      }

      let leaveRequest = await this.leaveRequestRepository.findOne({
        where: { userID: userID, leaveRequestID: leaveRequestID },
        relations: ['userID'],
      });

      if (!leaveRequest) {
        throw new Error(
          `Leave request with ID: ${leaveRequestID} could not be found for user with ID: ${userID}`
        );
      }
      const balancePayback = leaveRequest.status === 'Approved';

      leaveRequest.status = 'Cancelled';

      const errors = await validate(leaveRequest);

      if (errors.length > 0) {
        throw new Error(
          errors.map((err) => Object.values(err.constraints || {})).join(', ')
        );
      }

      leaveRequest = await this.leaveRequestRepository.save(leaveRequest);
      if (balancePayback) {
        const length = this.calculateLength(
          leaveRequest.startDate,
          leaveRequest.endDate
        );
        await this.changeLeaveBalance(userID, length);
      }

      ResponseHandler.sendSuccessResponse(
        res,
        instanceToPlain(leaveRequest),
        StatusCodes.OK
      );
    } catch (error: any) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        error.message
      );
    }
  };

  public approveLeave = async (req: Request, res: Response): Promise<void> => {
    console.log('This should not appear');
    try {
      const { userID, leaveRequestID } = req.body;

      if (!userID) {
        throw new Error('No userID Provided!');
      }

      if (!leaveRequestID) {
        throw new Error('No leaveRequestID Provided!');
      }

      let leaveRequest = await this.leaveRequestRepository.findOne({
        where: { userID: userID, leaveRequestID: leaveRequestID },
        relations: ['userID'],
      });

      if (!leaveRequest) {
        throw new Error(
          `Leave request with ID: ${leaveRequestID} could not be found for user with ID: ${userID}`
        );
      }

      if (leaveRequest.status !== 'Pending') {
        throw new Error(
          `Leave request has status: ${leaveRequest.status}. Cannot be approved.`
        );
      }

      leaveRequest.status = 'Approved';
      leaveRequest.reason = req.body.reason || '';

      const errors = await validate(leaveRequest);

      if (errors.length > 0) {
        throw new Error(
          errors.map((err) => Object.values(err.constraints || {})).join(', ')
        );
      }

      leaveRequest = await this.leaveRequestRepository.save(leaveRequest);

      const length = this.calculateLength(
        leaveRequest.startDate,
        leaveRequest.endDate
      );
      await this.changeLeaveBalance(userID, length * -1);

      ResponseHandler.sendSuccessResponse(
        res,
        instanceToPlain(leaveRequest),
        StatusCodes.OK
      );
    } catch (error: any) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        error.message
      );
    }
  };

  public rejectLeave = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userID, leaveRequestID, reason } = req.body;

      if (!userID) {
        throw new Error('No userID Provided!');
      }

      if (!leaveRequestID) {
        throw new Error('No leaveRequestID Provided!');
      }

      if (!reason) {
        throw new Error('Reason must be provided.');
      }

      let leaveRequest = await this.leaveRequestRepository.findOne({
        where: { userID: userID, leaveRequestID: leaveRequestID },
        relations: ['userID'],
      });

      if (!leaveRequest) {
        throw new Error(
          `Leave request with ID: ${leaveRequestID} could not be found for user with ID: ${userID}`
        );
      }

      if (leaveRequest.status !== 'Pending') {
        throw new Error(
          `Leave request has status: ${leaveRequest.status}. Cannot be rejected.`
        );
      }

      leaveRequest.status = 'Rejected';
      leaveRequest.reason = reason;

      const errors = await validate(leaveRequest);

      if (errors.length > 0) {
        throw new Error(
          errors.map((err) => Object.values(err.constraints || {})).join(', ')
        );
      }

      leaveRequest = await this.leaveRequestRepository.save(leaveRequest);

      ResponseHandler.sendSuccessResponse(
        res,
        instanceToPlain(leaveRequest),
        StatusCodes.OK
      );
    } catch (error: any) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        error.message
      );
    }
  };

  public getStatus = async (req: Request, res: Response): Promise<void> => {
    const userID = parseInt(req.params.userID);

    if (isNaN(userID)) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        'Invalid ID format'
      );
      return;
    }

    try {
      const leaveRequests = await this.leaveRequestRepository
        .createQueryBuilder('leaveReq')
        .leftJoin('leaveReq.userID', 'U')
        .where('leaveReq.userID = :userID', { userID })
        .orderBy('leaveReq.startDate', 'ASC')
        .getMany();

      if (!leaveRequests || leaveRequests.length === 0) {
        ResponseHandler.sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          `No leave requests for user ID: ${userID} not found`
        );
        return;
      }

      const leaveStatus = leaveRequests.map(
        ({ leaveRequestID, startDate, endDate, status, reason }) => ({
          leaveRequestID,
          startDate,
          endDate,
          status,
          reason,
        })
      );

      ResponseHandler.sendSuccessResponse(res, leaveStatus);
    } catch (error) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        `Error fetching leave status': ${error.message}`
      );
    }
  };

  public getBalance = async (req: Request, res: Response): Promise<void> => {
    const userID = parseInt(req.params.userID);

    if (isNaN(userID)) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        'Invalid ID format'
      );
      return;
    }

    try {
      const user = await this.userRepository.findOne({ where: { userID } });

      if (!user) {
        ResponseHandler.sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          `User with id: ${userID} not found`
        );
        return;
      }

      const balance = user.annualLeaveBalance;

      ResponseHandler.sendSuccessResponse(res, { leaveBalance: balance });
    } catch (error) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        `Error finding user balance: ${error.message}`
      );
    }
  };
}
