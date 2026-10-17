export interface IUser {
	id: string;
	name?: string;
	email?: string;
	emailVerified?: boolean;
	image?: string;
	isOnboarded?: boolean;
	createdAt?: Date;
	updatedAt?: Date;
}
