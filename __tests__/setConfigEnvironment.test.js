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
    expect(envFn).toBeCalledWith(
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
    expect(envFn).toBeCalledWith(
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
    expect(envFn).toBeCalledWith(
      SmallcaseGateway.ENV.PROD,
      "test-name",
      false,
      true,
      ["kite"]
    );
  });

  test("invalid", async () => {
    await SmallcaseGateway.setConfigEnvironment();
    expect(envFn).toBeCalledWith(
      SmallcaseGateway.ENV.PROD,
      "",
      false,
      false,
      []
    );

    await SmallcaseGateway.setConfigEnvironment({});
    expect(envFn).toBeCalledWith(
      SmallcaseGateway.ENV.PROD,
      "",
      false,
      false,
      []
    );

    await SmallcaseGateway.setConfigEnvironment(123);
    expect(envFn).toBeCalledWith(
      SmallcaseGateway.ENV.PROD,
      "",
      false,
      false,
      []
    );
  });
});
