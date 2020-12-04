jest.mock("react-native");

import SmallcaseGateway from "../index";
import { NativeModules } from "react-native";

describe("setConfigEnvironment", () => {
  const envFn = jest.spyOn(
    NativeModules.SmallcaseGateway,
    "setConfigEnvironment"
  );

  test("valid", async () => {
    await SmallcaseGateway.setConfigEnvironment({
      isAmoEnabled: true,
      isLeprechaun: true,
      gatewayName: "test-name",
      environmentName: "production",
      brokerList: ["kite", "trustline"],
    });
    expect(envFn).toHaveBeenNthCalledWith(
      1,
      SmallcaseGateway.ENV.PROD,
      "test-name",
      true,
      true,
      ["kite", "trustline"]
    );

    await SmallcaseGateway.setConfigEnvironment({
      isAmoEnabled: false,
      isLeprechaun: true,
      gatewayName: "test-name",
      environmentName: "production",
      brokerList: ["kite"],
    });
    expect(envFn).toHaveBeenNthCalledWith(
      2,
      SmallcaseGateway.ENV.PROD,
      "test-name",
      true,
      false,
      ["kite"]
    );

    await SmallcaseGateway.setConfigEnvironment({
      isAmoEnabled: true,
      isLeprechaun: false,
      gatewayName: "test-name",
      environmentName: "production",
      brokerList: ["kite"],
    });
    expect(envFn).toHaveBeenNthCalledWith(
      3,
      SmallcaseGateway.ENV.PROD,
      "test-name",
      false,
      true,
      ["kite"]
    );
  });

  test("invalid", async () => {
    await SmallcaseGateway.setConfigEnvironment();
    expect(envFn).toHaveBeenNthCalledWith(
      4,
      SmallcaseGateway.ENV.PROD,
      "",
      false,
      false,
      []
    );

    await SmallcaseGateway.setConfigEnvironment({});
    expect(envFn).toHaveBeenNthCalledWith(
      5,
      SmallcaseGateway.ENV.PROD,
      "",
      false,
      false,
      []
    );

    await SmallcaseGateway.setConfigEnvironment(123);
    expect(envFn).toHaveBeenNthCalledWith(
      6,
      SmallcaseGateway.ENV.PROD,
      "",
      false,
      false,
      []
    );
  });
});
