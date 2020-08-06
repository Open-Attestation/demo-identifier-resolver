import { APIGatewayEvent } from "aws-lambda";
import createHttpError from "http-errors";
import { publicRequestHandler } from "../../middlewares/handlers";
import { sheetsToJson } from "../../services/sheets";
import { config } from "../../config";
import { memoize } from "../../common/utils";

interface Identity {
  name: string;
}

interface Identities {
  [identifier: string]: Identity;
}

const getIdentifier = async (event: APIGatewayEvent) => {
  const { id } = event.pathParameters ?? { id: undefined };
  if (!id) {
    throw new createHttpError.BadRequest("Identifier is not provided");
  }

  const apiKey = event.headers["x-api-key"];

  if (!apiKey) {
    throw new createHttpError.BadRequest("API key is not provided testing");
  }

  const identities = await memoize(
    () =>
      sheetsToJson<Identities>({
        id: config.sheetsId,
        range: config.sheetsRange,
        keyBy: "identifier"
      }),
    "IDENTITIES"
  );
  const identity = identities[id.toLowerCase()];
  if (!identity) {
    throw new createHttpError.NotFound(`No profile found for ${id}`);
  }

  return { identity };
};

export const handler = publicRequestHandler(getIdentifier);
