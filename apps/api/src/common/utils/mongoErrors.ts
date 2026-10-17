import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";

/** Maps a thrown Mongoose/Mongo error to a ServiceResponse with a status the client can act on. Never echoes internals for 500s. */
export function toServiceFailure(ex: unknown, action: string) {
	if (ex instanceof mongoose.Error.ValidationError) {
		const first = Object.values(ex.errors)[0]?.message ?? "Invalid data";
		return ServiceResponse.failure(`Invalid data: ${first}`, null, StatusCodes.BAD_REQUEST);
	}
	if (ex instanceof mongoose.Error.CastError) {
		return ServiceResponse.failure("Invalid id", null, StatusCodes.BAD_REQUEST);
	}
	if (ex instanceof mongoose.Error.VersionError) {
		return ServiceResponse.failure("The form was changed elsewhere. Reload and try again.", null, StatusCodes.CONFLICT);
	}
	if ((ex as { code?: number })?.code === 11000) {
		return ServiceResponse.failure("That value is already in use.", null, StatusCodes.CONFLICT);
	}
	logger.error(`Error ${action}: ${(ex as Error)?.message}`);
	return ServiceResponse.failure(`An error occurred while ${action}.`, null, StatusCodes.INTERNAL_SERVER_ERROR);
}
