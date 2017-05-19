//    Copyright 2017 ilcato
// 
//    Licensed under the Apache License, Version 2.0 (the "License");
//    you may not use this file except in compliance with the License.
//    You may obtain a copy of the License at
// 
//        http://www.apache.org/licenses/LICENSE-2.0
// 
//    Unless required by applicable law or agreed to in writing, software
//    distributed under the License is distributed on an "AS IS" BASIS,
//    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//    See the License for the specific language governing permissions and
//    limitations under the License.
// Fibaro Home Center 2 Platform plugin for HomeBridge
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginName = 'homebridge-fibaro-hc2';
exports.platformName = 'FibaroHC2';
class ShadowService {
    constructor(controlService, characteristics) {
        this.controlService = controlService;
        this.characteristics = characteristics;
    }
}
exports.ShadowService = ShadowService;
class ShadowAccessory {
    constructor(device, services, hapAccessory, hapService, hapCharacteristic, platform, isSecurritySystem) {
        this.name = device.name;
        this.roomID = device.roomID;
        this.services = services;
        this.accessory = null,
            this.hapAccessory = hapAccessory;
        this.hapService = hapService;
        this.hapCharacteristic = hapCharacteristic;
        this.platform = platform;
        this.isSecuritySystem = isSecurritySystem ? isSecurritySystem : false;
        for (let i = 0; i < services.length; i++) {
            if (services[i].controlService.subtype == undefined)
                services[i].controlService.subtype = device.id + "--"; // "DEVICE_ID-VIRTUAL_BUTTON_ID-RGB_MARKER
        }
    }
    initAccessory() {
        this.accessory.getService(this.hapService.AccessoryInformation)
            .setCharacteristic(this.hapCharacteristic.Manufacturer, "IlCato")
            .setCharacteristic(this.hapCharacteristic.Model, "HomeCenterBridgedAccessory")
            .setCharacteristic(this.hapCharacteristic.SerialNumber, "<unknown>");
    }
    removeNoMoreExistingServices() {
        for (let t = 0; t < this.accessory.services.length; t++) {
            let found = false;
            for (let s = 0; s < this.services.length; s++) {
                // TODO: check why test for undefined
                if (this.accessory.services[t].displayName == undefined || this.services[s].controlService.displayName == this.accessory.services[t].displayName) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                this.accessory.removeService(this.accessory.services[t]);
            }
        }
    }
    addNewServices(platform) {
        for (let s = 0; s < this.services.length; s++) {
            let service = this.services[s];
            let serviceExists = this.accessory.getService(service.controlService.displayName);
            if (!serviceExists) {
                this.accessory.addService(service.controlService);
                for (let i = 0; i < service.characteristics.length; i++) {
                    let characteristic = service.controlService.getCharacteristic(service.characteristics[i]);
                    characteristic.props.needsBinding = true;
                    if (characteristic.UUID == (new this.hapCharacteristic.CurrentAmbientLightLevel()).UUID) {
                        characteristic.props.maxValue = 10000;
                        characteristic.props.minStep = 1;
                        characteristic.props.minValue = 0;
                    }
                    if (characteristic.UUID == (new this.hapCharacteristic.CurrentTemperature()).UUID) {
                        characteristic.props.minValue = -50;
                    }
                    platform.bindCharacteristicEvents(characteristic, service.controlService);
                }
            }
        }
    }
    resgisterUpdateccessory(isNewAccessory, api) {
        this.accessory.reachable = true;
        if (isNewAccessory)
            api.registerPlatformAccessories(exports.pluginName, exports.platformName, [this.accessory]);
        else
            api.updatePlatformAccessories([this.accessory]);
        this.accessory.reviewed = true; // Mark accessory as reviewed in order to remove the not reviewed ones
    }
    setAccessory(accessory) {
        this.accessory = accessory;
    }
    static createShadowAccessory(device, hapAccessory, hapService, hapCharacteristic, platform) {
        let rm = HC2HKMapping.get(device.type);
        if (!rm)
            return undefined;
        let ss = rm(device, hapAccessory, hapService, hapCharacteristic, platform);
        return new ShadowAccessory(device, ss, hapAccessory, hapService, hapCharacteristic, platform);
    }
    static createShadowSecuritySystemAccessory(device, hapAccessory, hapService, hapCharacteristic, platform) {
        let service = new ShadowService(new hapService.SecuritySystem("FibaroSecuritySystem"), [hapCharacteristic.SecuritySystemCurrentState, hapCharacteristic.SecuritySystemTargetState]);
        service.controlService.subtype = "0--";
        return new ShadowAccessory(device, [service], hapAccessory, hapService, hapCharacteristic, platform, true);
    }
    static createShadowLightbulb(device, hapAccessory, hapService, hapCharacteristic, platform) {
        return [new ShadowService(new hapService.Lightbulb(device.name), [hapCharacteristic.On, hapCharacteristic.Brightness])];
    }
    static createShadowSwitch(device, hapAccessory, hapService, hapCharacteristic, platform) {
        let controlService;
        switch (device.properties.deviceControlType) {
            case "2": // Lighting
            case "5": // Bedside Lamp
            case "7":
                controlService = new hapService.Lightbulb(device.name);
                break;
            default:
                controlService = new hapService.Switch(device.name);
                break;
        }
        return [new ShadowService(controlService, [hapCharacteristic.On])];
    }
    static createShadowWindowCovering(device, hapAccessory, hapService, hapCharacteristic, platform) {
        return [new ShadowService(new hapService.WindowCovering(device.name), [hapCharacteristic.CurrentPosition, hapCharacteristic.TargetPosition, hapCharacteristic.PositionState])];
    }
    static createShadowMotionSensor(device, hapAccessory, hapService, hapCharacteristic, platform) {
        return [new ShadowService(new hapService.MotionSensor(device.name), [hapCharacteristic.MotionDetected])];
    }
    static createShadowTemperatureSensor(device, hapAccessory, hapService, hapCharacteristic, platform) {
        return [new ShadowService(new hapService.TemperatureSensor(device.name), [hapCharacteristic.CurrentTemperature])];
    }
    static createShadowHumiditySensor(device, hapAccessory, hapService, hapCharacteristic, platform) {
        return [new ShadowService(new hapService.HumiditySensor(device.name), [hapCharacteristic.CurrentRelativeHumidity])];
    }
    static createShadowDoorWindowSensor(device, hapAccessory, hapService, hapCharacteristic, platform) {
        return [new ShadowService(new hapService.ContactSensor(device.name), [hapCharacteristic.ContactSensorState])];
    }
    static createShadowFloodSensor(device, hapAccessory, hapService, hapCharacteristic, platform) {
        return [new ShadowService(new hapService.LeakSensor(device.name), [hapCharacteristic.LeakDetected])];
    }
    static createShadowSmokeSensor(device, hapAccessory, hapService, hapCharacteristic, platform) {
        return [new ShadowService(new hapService.SmokeSensor(device.name), [hapCharacteristic.SmokeDetected])];
    }
    static createShadowLightSensor(device, hapAccessory, hapService, hapCharacteristic, platform) {
        return [new ShadowService(new hapService.LightSensor(device.name), [hapCharacteristic.CurrentAmbientLightLevel])];
    }
    static createShadowOutlet(device, hapAccessory, hapService, hapCharacteristic, platform) {
        return [new ShadowService(new hapService.Outlet(device.name), [hapCharacteristic.On, hapCharacteristic.OutletInUse])];
    }
    static createShadowLockMechanism(device, hapAccessory, hapService, hapCharacteristic, platform) {
        return [new ShadowService(new hapService.LockMechanism(device.name), [hapCharacteristic.LockCurrentState, hapCharacteristic.LockTargetState])];
    }
    static createShadowSetPoint(device, hapAccessory, hapService, hapCharacteristic, platform) {
        return [new ShadowService(new hapService.Thermostat(device.name), [hapCharacteristic.CurrentTemperature, hapCharacteristic.TargetTemperature, hapCharacteristic.CurrentHeatingCoolingState, hapCharacteristic.TargetHeatingCoolingState, hapCharacteristic.TemperatureDisplayUnits])];
    }
    static createShadowVirtualDevice(device, hapAccessory, hapService, hapCharacteristic, platform) {
        let pushButtonServices = new Array();
        let pushButtonService;
        for (let r = 0; r < device.properties.rows.length; r++) {
            if (device.properties.rows[r].type == "button") {
                for (let e = 0; e < device.properties.rows[r].elements.length; e++) {
                    pushButtonService = new ShadowService(new hapService.Switch(device.properties.rows[r].elements[e].caption), [hapCharacteristic.On]);
                    pushButtonService.controlService.subtype = device.id + "-" + device.properties.rows[r].elements[e].id; // For Virtual devices it is device_id + "-" + button_id
                    pushButtonServices.push(pushButtonService);
                }
            }
        }
        return pushButtonServices;
    }
    static createShadowColorBulb(device, hapAccessory, hapService, hapCharacteristic, platform) {
        let service = { controlService: new hapService.Lightbulb(device.name), characteristics: [hapCharacteristic.On, hapCharacteristic.Brightness, hapCharacteristic.Hue, hapCharacteristic.Saturation] };
        service.controlService.HSBValue = { hue: 0, saturation: 0, brightness: 100 };
        service.controlService.RGBValue = { red: 0, green: 0, blue: 0 };
        service.controlService.countColorCharacteristics = 0;
        service.controlService.timeoutIdColorCharacteristics = 0;
        service.controlService.subtype = device.id + "--RGB"; // for RGB color add a subtype parameter; it will go into 3rd position: "DEVICE_ID-VIRTUAL_BUTTON_ID-RGB_MARKER
        return [service];
    }
}
exports.ShadowAccessory = ShadowAccessory;
let HC2HKMapping = new Map([
    ["com.fibaro.multilevelSwitch", ShadowAccessory.createShadowLightbulb],
    ["com.fibaro.FGD212", ShadowAccessory.createShadowLightbulb],
    ["com.fibaro.binarySwitch", ShadowAccessory.createShadowSwitch],
    ["com.fibaro.developer.bxs.virtualBinarySwitch", ShadowAccessory.createShadowSwitch],
    ["com.fibaro.FGR221", ShadowAccessory.createShadowWindowCovering],
    ["com.fibaro.FGRM222", ShadowAccessory.createShadowWindowCovering],
    ["com.fibaro.rollerShutter", ShadowAccessory.createShadowWindowCovering],
    ["com.fibaro.FGMS001", ShadowAccessory.createShadowMotionSensor],
    ["com.fibaro.motionSensor", ShadowAccessory.createShadowMotionSensor],
    ["com.fibaro.temperatureSensor", ShadowAccessory.createShadowTemperatureSensor],
    ["com.fibaro.humiditySensor", ShadowAccessory.createShadowHumiditySensor],
    ["com.fibaro.doorSensor", ShadowAccessory.createShadowDoorWindowSensor],
    ["com.fibaro.windowSensor", ShadowAccessory.createShadowDoorWindowSensor],
    ["com.fibaro.FGFS101", ShadowAccessory.createShadowFloodSensor],
    ["com.fibaro.floodSensor", ShadowAccessory.createShadowFloodSensor],
    ["com.fibaro.FGSS001", ShadowAccessory.createShadowSmokeSensor],
    ["com.fibaro.lightSensor", ShadowAccessory.createShadowLightSensor],
    ["com.fibaro.FGWP101", ShadowAccessory.createShadowOutlet],
    ["com.fibaro.FGWP102", ShadowAccessory.createShadowOutlet],
    ["com.fibaro.doorLock", ShadowAccessory.createShadowOutlet],
    ["com.fibaro.gerda", ShadowAccessory.createShadowLockMechanism],
    ["com.fibaro.setPoint", ShadowAccessory.createShadowSetPoint],
    ["com.fibaro.thermostatDanfoss", ShadowAccessory.createShadowSetPoint],
    ["com.fibaro.com.fibaro.thermostatHorstmann", ShadowAccessory.createShadowSetPoint],
    ["virtual_device", ShadowAccessory.createShadowVirtualDevice],
    ["com.fibaro.FGRGBW441M", ShadowAccessory.createShadowColorBulb],
    ["com.fibaro.colorController", ShadowAccessory.createShadowColorBulb]
]);