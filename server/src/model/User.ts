import { Field, ID, ObjectType, registerEnumType } from 'type-graphql';
import { User as PrismaUser, UserStatus } from '@prisma/client';
import db from 'util/db';
import Result from 'lib/Result';
import ApplicationError, { DatabaseError } from 'lib/ApplicationError';
import { ValidationError } from 'common/errors';
import bcrypt from 'bcrypt';
import Response from 'endpoint/response/Response';

const SALT_ROUNDS = 10;

// Register the UserStatus enum with type-graphql
registerEnumType(UserStatus, { name: 'UserStatus' });

export interface CreateUserInput {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface UpdateUserInput {
  first_name?: string;
  last_name?: string;
  status?: UserStatus;
}

@ObjectType()
export default class User implements PrismaUser {
  @Field((type) => ID)
  id: string;

  @Field()
  email: string;

  // Password is not exposed via GraphQL
  password: string;

  @Field({ nullable: true })
  first_name: string | null;

  @Field({ nullable: true })
  last_name: string | null;

  @Field((type) => UserStatus)
  status: UserStatus;

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;

  constructor(user: PrismaUser | any) {
    Object.assign(this, user);
  }

  static async create(input: CreateUserInput): Promise<Result<User, ApplicationError>> {
    try {
      // Check if user already exists
      const existing = await db.user.findUnique({
        where: { email: input.email.toLowerCase() },
      });

      if (existing) {
        return Result.fail(new ValidationError(null, 'User with this email already exists'));
      }

      // Hash password
      const hashed_password = await bcrypt.hash(input.password, SALT_ROUNDS);

      const user = await db.user.create({
        data: {
          email: input.email.toLowerCase(),
          password: hashed_password,
          first_name: input.first_name || null,
          last_name: input.last_name || null,
        },
      });

      return Result.success(new User(user));
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to create user'));
    }
  }

  static async fetch_by_id(id: string): Promise<Result<User | null, ApplicationError>> {
    try {
      const user = await db.user.findUnique({
        where: { id },
      });

      return Result.success(user ? new User(user) : null);
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to fetch user'));
    }
  }

  static async fetch_by_email(email: string): Promise<Result<User | null, ApplicationError>> {
    try {
      const user = await db.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      return Result.success(user ? new User(user) : null);
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to fetch user'));
    }
  }

  static async verify_password(user: User | PrismaUser, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  static async update(
    id: string,
    input: UpdateUserInput
  ): Promise<Result<User, ApplicationError>> {
    try {
      const user = await db.user.update({
        where: { id },
        data: input,
      });

      return Result.success(new User(user));
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to update user'));
    }
  }

  static async delete(id: string): Promise<Result<User, ApplicationError>> {
    try {
      const user = await db.user.delete({
        where: { id },
      });

      return Result.success(new User(user));
    } catch (error) {
      return Result.fail(new DatabaseError(error, 'Failed to delete user'));
    }
  }
}

@ObjectType()
export class UserResponse extends Response(User) {}
