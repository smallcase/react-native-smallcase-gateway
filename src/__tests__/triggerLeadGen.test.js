jest.mock("react-native");

import SmallcaseGateway from "../index";
import { NativeModules } from "react-native";

describe("triggerLeadGen", () => {
  const leadGenFn = jest.spyOn(
    NativeModules.SmallcaseGateway,
    "triggerLeadGen"
  );

  test("valid", async () => {
    await SmallcaseGateway.triggerLeadGen(
      {
        name: "test-name",
        phone: "test-phone",
      },
      {
        source: "test-source",
        campaign: "test-campaign",
      }
    );

    expect(leadGenFn).toHaveBeenNthCalledWith(
      1,
      {
        name: "test-name",
        phone: "test-phone",
      },
      {
        source: "test-source",
        campaign: "test-campaign",
      }
    );

    await SmallcaseGateway.triggerLeadGen();
    expect(leadGenFn).toHaveBeenNthCalledWith(2, {}, {});
  });

  test("invalid", async () => {
    await SmallcaseGateway.triggerLeadGen("test-token", "t");
    expect(leadGenFn).toHaveBeenNthCalledWith(3, {}, {});
  });

  test("invalid null", async () => {
    await SmallcaseGateway.triggerLeadGen(null, undefined);
    expect(leadGenFn).toHaveBeenNthCalledWith(4, {}, {});
  });
});
