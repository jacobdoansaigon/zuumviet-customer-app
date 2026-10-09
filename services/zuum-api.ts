/* eslint-disable */
// SINH TỰ ĐỘNG từ apps/api (`pnpm --filter @zuumviet/api gen:client`) — KHÔNG SỬA TAY.
// Kiểu request/response của mọi route app khách + app đối tác gọi, và một client fetch nhỏ.
// Ngày giờ là chuỗi ISO 8601; tiền là số nguyên VND. Chi tiết nghiệp vụ: Swagger /docs của API.

export interface ZuumRoutes {
  'POST /v1/auth/logout': {
    response: void;
  };
  'GET /v1/customer/addresses': {
    response: Array<{
      id: string;
      kind: "home" | "work" | "other";
      label: string;
      address: string;
      lat: number;
      lng: number;
      note: null | string;
      contactName: null | string;
      contactPhone: null | string;
      updatedAt: string;
    }>;
  };
  'POST /v1/customer/addresses': {
    body: {
      label: string;
      address: string;
      lat: number;
      lng: number;
      note?: null | string;
      contactName?: null | string;
      contactPhone?: null | string;
      kind?: "home" | "work" | "other";
    };
    response: {
      id: string;
      kind: "home" | "work" | "other";
      label: string;
      address: string;
      lat: number;
      lng: number;
      note: null | string;
      contactName: null | string;
      contactPhone: null | string;
      updatedAt: string;
    };
  };
  'DELETE /v1/customer/addresses/:id': {
    params: { id: string };
    response: void;
  };
  'PATCH /v1/customer/addresses/:id': {
    params: { id: string };
    body: {
      kind?: "home" | "work" | "other";
      label?: string;
      address?: string;
      lat?: number;
      lng?: number;
      note?: null | string;
      contactName?: null | string;
      contactPhone?: null | string;
    };
    response: {
      id: string;
      kind: "home" | "work" | "other";
      label: string;
      address: string;
      lat: number;
      lng: number;
      note: null | string;
      contactName: null | string;
      contactPhone: null | string;
      updatedAt: string;
    };
  };
  /** Mã giới thiệu, cấp, số F1/F2/F3, thưởng tạm tính / đã nhận, chính sách đang áp */
  'GET /v1/customer/affiliate': {
    response: ({
      joined: boolean;
      tree: "customer" | "partner";
      message: string;
    }) | ({
      joined: boolean;
      tree: "customer" | "partner";
      code: string;
      level: {
        key: string;
        name: string;
      };
      nextLevel: null | {
        key: string;
        name: string;
        need: {
          f1: number;
          f2: number;
          f3: number;
        };
      };
      counts: {
        f1: number;
        f2: number;
        f3: number;
      };
      referrer: null | {
        code: string;
        fullName: string;
      };
      canSetReferrer: boolean;
      joinedAt: string;
      earnings: {
        thisMonthPending: number;
        pending: number;
        paid: number;
        forfeited: number;
      };
      policy: {
        commissionBps: number[];
        levels: Array<{
          key: string;
          name: string;
          minF1: number;
          minF2: number;
          minF3: number;
        }>;
        maxF1: number;
        payout: {
          minMonthlyOrders: number;
          minMonthlyAmount: number;
          minSupportPoints: number;
        };
      };
    });
  };
  'GET /v1/customer/affiliate/earnings': {
    query?: {
      page?: number;
      pageSize?: number;
    };
    response: {
      items: Array<{
        id: string;
        orderCode: string;
        depth: number;
        amount: number;
        month: string;
        status: "accrued" | "paid" | "forfeited";
        createdAt: string;
      }>;
      page: number;
      pageSize: number;
      total: number;
    };
  };
  'GET /v1/customer/affiliate/members': {
    query?: {
      page?: number;
      pageSize?: number;
      depth?: number;
    };
    response: {
      items: Array<{
        memberId: string;
        code: string;
        fullName: string;
        phone: string;
        active: boolean;
        level: string;
        f1Count: number;
        joinedAt: string;
      }>;
      page: number;
      pageSize: number;
      total: number;
    };
  };
  /** Nhập mã người giới thiệu (khi chưa có, trong thời hạn chính sách cho phép) */
  'POST /v1/customer/affiliate/referrer': {
    body: {
      code: string;
    };
    response: ({
      joined: boolean;
      tree: "customer" | "partner";
      message: string;
    }) | ({
      joined: boolean;
      tree: "customer" | "partner";
      code: string;
      level: {
        key: string;
        name: string;
      };
      nextLevel: null | {
        key: string;
        name: string;
        need: {
          f1: number;
          f2: number;
          f3: number;
        };
      };
      counts: {
        f1: number;
        f2: number;
        f3: number;
      };
      referrer: null | {
        code: string;
        fullName: string;
      };
      canSetReferrer: boolean;
      joinedAt: string;
      earnings: {
        thisMonthPending: number;
        pending: number;
        paid: number;
        forfeited: number;
      };
      policy: {
        commissionBps: number[];
        levels: Array<{
          key: string;
          name: string;
          minF1: number;
          minF2: number;
          minF3: number;
        }>;
        maxF1: number;
        payout: {
          minMonthlyOrders: number;
          minMonthlyAmount: number;
          minSupportPoints: number;
        };
      };
    });
  };
  /** Xem trước người giới thiệu theo mã (trước khi nhập) */
  'GET /v1/customer/affiliate/referrer-preview': {
    query: {
      code: string;
    };
    response: {
      code: string;
      fullName: string;
      level: {
        key: string;
        name: string;
      };
      f1Count: number;
      full: boolean;
    };
  };
  /** Mã khách dùng được — nhập mã ở bước báo giá (`couponCode`) */
  'GET /v1/customer/coupons': {
    response: Array<{
      code: string;
      name: string;
      description: null | string;
      type: "amount" | "percent";
      value: number;
      maxDiscount: null | number;
      minOrderValue: number;
      endsAt: null | string;
      services: Array<{
        id: string;
        name: string;
      }>;
    }>;
  };
  'PUT /v1/customer/devices/:deviceId': {
    params: { deviceId: string };
    body: {
      platform: "ios" | "android" | "web";
      appVersion?: string;
      osVersion?: string;
      model?: string;
      pushToken?: null | string;
      pushEnabled?: boolean;
    };
    response: {
      platform: "ios" | "android" | "web";
      pushEnabled: boolean;
      deviceId: string;
      lastSeenAt: string;
    };
  };
  'DELETE /v1/customer/devices/:deviceId': {
    params: { deviceId: string };
    response: void;
  };
  'POST /v1/customer/files': {
    body: {
      purpose: "partner_document" | "avatar" | "order_proof";
      contentType: string;
      size: number;
    };
    response: {
      fileId: string;
      url: string;
      method: "PUT";
      headers: {
        [key: string]: string;
      };
      expiresAt: string;
    };
  };
  'GET /v1/customer/files/:id': {
    params: { id: string };
    response: {
      id: string;
      purpose: string;
      contentType: string;
      size: number;
      status: string;
      createdAt: string;
      url: null | string;
    };
  };
  'POST /v1/customer/files/:id/complete': {
    params: { id: string };
    response: {
      id: string;
      purpose: string;
      contentType: string;
      size: number;
      status: string;
      createdAt: string;
      url: null | string;
    };
  };
  'GET /v1/customer/intercity/bookings': {
    query?: {
      page?: number;
      pageSize?: number;
    };
    response: {
      items: Array<{
        trip: {
          id: string;
          kind: "bus" | "carpool";
          status: "scheduled" | "completed" | "cancelled" | "departed";
          operator: {
            id: string;
            code: string;
            name: string;
          };
          from: {
            id: string;
            name: string;
            station: string;
            address: string;
          };
          to: {
            id: string;
            name: string;
            station: string;
            address: string;
          };
          departAt: string;
          arriveAt: string;
          pricePerSeat: number;
          seatCount: number;
          amenities: string[];
          vehicle: {
            type: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
            name: null | string;
            color: null | string;
            plate: null | string;
          };
          cargoFee: null | number;
          homePickupFee: null | number;
          homeDropoffFee: null | number;
          note: null | string;
        };
        id: string;
        code: string;
        status: "completed" | "cancelled" | "expired" | "held" | "confirmed";
        seatIds: string[];
        unitPrice: number;
        price: null | {
          seats: number;
          cargo: number;
          pickup: number;
          dropoff: number;
          total: number;
        };
        total: number;
        paymentMethod: null | "cash" | "wallet";
        withCargo: boolean;
        cargoNote: null | string;
        pickup: {
          type: string;
          address: null | string;
        };
        dropoff: {
          type: string;
          address: null | string;
        };
        contactName: null | string;
        contactPhone: null | string;
        heldUntil: null | string;
        confirmedAt: null | string;
        cancelledAt: null | string;
        cancelReason: null | string;
        canCancel: boolean;
        createdAt: string;
      }>;
      page: number;
      pageSize: number;
      total: number;
    };
  };
  'GET /v1/customer/intercity/bookings/:id': {
    params: { id: string };
    response: {
      trip: {
        id: string;
        kind: "bus" | "carpool";
        status: "scheduled" | "completed" | "cancelled" | "departed";
        operator: {
          id: string;
          code: string;
          name: string;
        };
        from: {
          id: string;
          name: string;
          station: string;
          address: string;
        };
        to: {
          id: string;
          name: string;
          station: string;
          address: string;
        };
        departAt: string;
        arriveAt: string;
        pricePerSeat: number;
        seatCount: number;
        amenities: string[];
        vehicle: {
          type: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
          name: null | string;
          color: null | string;
          plate: null | string;
        };
        cargoFee: null | number;
        homePickupFee: null | number;
        homeDropoffFee: null | number;
        note: null | string;
      };
      id: string;
      code: string;
      status: "completed" | "cancelled" | "expired" | "held" | "confirmed";
      seatIds: string[];
      unitPrice: number;
      price: null | {
        seats: number;
        cargo: number;
        pickup: number;
        dropoff: number;
        total: number;
      };
      total: number;
      paymentMethod: null | "cash" | "wallet";
      withCargo: boolean;
      cargoNote: null | string;
      pickup: {
        type: string;
        address: null | string;
      };
      dropoff: {
        type: string;
        address: null | string;
      };
      contactName: null | string;
      contactPhone: null | string;
      heldUntil: null | string;
      confirmedAt: null | string;
      cancelledAt: null | string;
      cancelReason: null | string;
      canCancel: boolean;
      createdAt: string;
    };
  };
  'POST /v1/customer/intercity/bookings/:id/cancel': {
    params: { id: string };
    response: {
      trip: {
        id: string;
        kind: "bus" | "carpool";
        status: "scheduled" | "completed" | "cancelled" | "departed";
        operator: {
          id: string;
          code: string;
          name: string;
        };
        from: {
          id: string;
          name: string;
          station: string;
          address: string;
        };
        to: {
          id: string;
          name: string;
          station: string;
          address: string;
        };
        departAt: string;
        arriveAt: string;
        pricePerSeat: number;
        seatCount: number;
        amenities: string[];
        vehicle: {
          type: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
          name: null | string;
          color: null | string;
          plate: null | string;
        };
        cargoFee: null | number;
        homePickupFee: null | number;
        homeDropoffFee: null | number;
        note: null | string;
      };
      id: string;
      code: string;
      status: "completed" | "cancelled" | "expired" | "held" | "confirmed";
      seatIds: string[];
      unitPrice: number;
      price: null | {
        seats: number;
        cargo: number;
        pickup: number;
        dropoff: number;
        total: number;
      };
      total: number;
      paymentMethod: null | "cash" | "wallet";
      withCargo: boolean;
      cargoNote: null | string;
      pickup: {
        type: string;
        address: null | string;
      };
      dropoff: {
        type: string;
        address: null | string;
      };
      contactName: null | string;
      contactPhone: null | string;
      heldUntil: null | string;
      confirmedAt: null | string;
      cancelledAt: null | string;
      cancelReason: null | string;
      canCancel: boolean;
      createdAt: string;
    };
  };
  'POST /v1/customer/intercity/bookings/:id/confirm': {
    params: { id: string };
    body: {
      paymentMethod: "cash" | "wallet";
      contactName: string;
      contactPhone: string;
      withCargo?: boolean;
      cargoNote?: string;
      pickup?: {
        type: "home" | "station";
        address?: string;
      };
      dropoff?: {
        type: "home" | "station";
        address?: string;
      };
    };
    response: {
      trip: {
        id: string;
        kind: "bus" | "carpool";
        status: "scheduled" | "completed" | "cancelled" | "departed";
        operator: {
          id: string;
          code: string;
          name: string;
        };
        from: {
          id: string;
          name: string;
          station: string;
          address: string;
        };
        to: {
          id: string;
          name: string;
          station: string;
          address: string;
        };
        departAt: string;
        arriveAt: string;
        pricePerSeat: number;
        seatCount: number;
        amenities: string[];
        vehicle: {
          type: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
          name: null | string;
          color: null | string;
          plate: null | string;
        };
        cargoFee: null | number;
        homePickupFee: null | number;
        homeDropoffFee: null | number;
        note: null | string;
      };
      id: string;
      code: string;
      status: "completed" | "cancelled" | "expired" | "held" | "confirmed";
      seatIds: string[];
      unitPrice: number;
      price: null | {
        seats: number;
        cargo: number;
        pickup: number;
        dropoff: number;
        total: number;
      };
      total: number;
      paymentMethod: null | "cash" | "wallet";
      withCargo: boolean;
      cargoNote: null | string;
      pickup: {
        type: string;
        address: null | string;
      };
      dropoff: {
        type: string;
        address: null | string;
      };
      contactName: null | string;
      contactPhone: null | string;
      heldUntil: null | string;
      confirmedAt: null | string;
      cancelledAt: null | string;
      cancelReason: null | string;
      canCancel: boolean;
      createdAt: string;
    };
  };
  /** Nhả ghế đang giữ — chỉ tác động khi vé còn "đang giữ chỗ"; vé đã đặt → 409 intercity.already_confirmed */
  'POST /v1/customer/intercity/bookings/:id/release': {
    params: { id: string };
    response: {
      trip: {
        id: string;
        kind: "bus" | "carpool";
        status: "scheduled" | "completed" | "cancelled" | "departed";
        operator: {
          id: string;
          code: string;
          name: string;
        };
        from: {
          id: string;
          name: string;
          station: string;
          address: string;
        };
        to: {
          id: string;
          name: string;
          station: string;
          address: string;
        };
        departAt: string;
        arriveAt: string;
        pricePerSeat: number;
        seatCount: number;
        amenities: string[];
        vehicle: {
          type: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
          name: null | string;
          color: null | string;
          plate: null | string;
        };
        cargoFee: null | number;
        homePickupFee: null | number;
        homeDropoffFee: null | number;
        note: null | string;
      };
      id: string;
      code: string;
      status: "completed" | "cancelled" | "expired" | "held" | "confirmed";
      seatIds: string[];
      unitPrice: number;
      price: null | {
        seats: number;
        cargo: number;
        pickup: number;
        dropoff: number;
        total: number;
      };
      total: number;
      paymentMethod: null | "cash" | "wallet";
      withCargo: boolean;
      cargoNote: null | string;
      pickup: {
        type: string;
        address: null | string;
      };
      dropoff: {
        type: string;
        address: null | string;
      };
      contactName: null | string;
      contactPhone: null | string;
      heldUntil: null | string;
      confirmedAt: null | string;
      cancelledAt: null | string;
      cancelReason: null | string;
      canCancel: boolean;
      createdAt: string;
    };
  };
  /** Giữ ghế 10 phút */
  'POST /v1/customer/intercity/trips/:id/holds': {
    params: { id: string };
    body: {
      seatIds: string[];
    };
    response: {
      trip: {
        id: string;
        kind: "bus" | "carpool";
        status: "scheduled" | "completed" | "cancelled" | "departed";
        operator: {
          id: string;
          code: string;
          name: string;
        };
        from: {
          id: string;
          name: string;
          station: string;
          address: string;
        };
        to: {
          id: string;
          name: string;
          station: string;
          address: string;
        };
        departAt: string;
        arriveAt: string;
        pricePerSeat: number;
        seatCount: number;
        amenities: string[];
        vehicle: {
          type: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
          name: null | string;
          color: null | string;
          plate: null | string;
        };
        cargoFee: null | number;
        homePickupFee: null | number;
        homeDropoffFee: null | number;
        note: null | string;
      };
      id: string;
      code: string;
      status: "completed" | "cancelled" | "expired" | "held" | "confirmed";
      seatIds: string[];
      unitPrice: number;
      price: null | {
        seats: number;
        cargo: number;
        pickup: number;
        dropoff: number;
        total: number;
      };
      total: number;
      paymentMethod: null | "cash" | "wallet";
      withCargo: boolean;
      cargoNote: null | string;
      pickup: {
        type: string;
        address: null | string;
      };
      dropoff: {
        type: string;
        address: null | string;
      };
      contactName: null | string;
      contactPhone: null | string;
      heldUntil: null | string;
      confirmedAt: null | string;
      cancelledAt: null | string;
      cancelReason: null | string;
      canCancel: boolean;
      createdAt: string;
    };
  };
  'GET /v1/customer/me': {
    response: {
      id: string;
      code: string;
      phone: string;
      fullName: string;
      email: null | string;
      avatarUrl: null | string;
      status: string;
      createdAt: string;
    };
  };
  'PATCH /v1/customer/me': {
    body: {
      fullName?: string;
      email?: null | string;
      avatarFileId?: null | string;
    };
    response: {
      id: string;
      code: string;
      phone: string;
      fullName: string;
      email: null | string;
      avatarUrl: null | string;
      status: string;
      createdAt: string;
    };
  };
  'POST /v1/customer/me/passcode': {
    body: {
      currentPasscode: string;
      newPasscode: string;
    };
    response: void;
  };
  'GET /v1/customer/notifications': {
    query?: {
      page?: number;
      pageSize?: number;
    };
    response: {
      unread: number;
      items: Array<{
        id: string;
        type: "order" | "campaign" | "wallet" | "system" | "offer" | "partner_review";
        title: string;
        body: string;
        data: unknown;
        readAt: null | string;
        createdAt: string;
      }>;
      page: number;
      pageSize: number;
      total: number;
    };
  };
  /** Xoá hết hộp thư */
  'DELETE /v1/customer/notifications': {
    response: {
      unread: number;
    };
  };
  /** Xoá một thông báo khỏi hộp thư */
  'DELETE /v1/customer/notifications/:id': {
    params: { id: string };
    response: {
      unread: number;
    };
  };
  'POST /v1/customer/notifications/:id/read': {
    params: { id: string };
    response: {
      unread: number;
    };
  };
  'POST /v1/customer/notifications/read-all': {
    response: {
      unread: number;
    };
  };
  'GET /v1/customer/notifications/unread-count': {
    response: {
      unread: number;
    };
  };
  'GET /v1/customer/orders': {
    query?: {
      page?: number;
      pageSize?: number;
      scope?: "active" | "history";
    };
    response: {
      items: Array<{
        id: string;
        code: string;
        status: "scheduled" | "searching" | "assigned" | "arrived_pickup" | "picked_up" | "completed" | "no_driver_found" | "cancelled";
        service: {
          id: string;
          kind: "delivery" | "ride" | "driver_hire" | "moving" | "charter" | "on_site";
          name: string;
        };
        pickupAddress: string;
        stops: Array<{
          address: string;
          status: "pending" | "failed" | "arrived" | "delivered" | "returned";
          seq: number;
        }>;
        total: number;
        codTotal: number;
        paymentMethod: "cash" | "wallet";
        scheduledAt: null | string;
        createdAt: string;
        completedAt: null | string;
        customer: null | {
          id: string;
          code: string;
          phone: string;
          fullName: string;
        };
        partner: null | {
          id: string;
          code: string;
          phone: string;
          fullName: string;
        };
      }>;
      page: number;
      pageSize: number;
      total: number;
    };
  };
  'POST /v1/customer/orders': {
    body: {
      quoteId: string;
      paymentMethod?: "cash" | "wallet";
      pickup?: {
        contactName?: string;
        contactPhone?: string;
        note?: string;
      };
      stops?: Array<{
        contactName?: string;
        contactPhone?: string;
        note?: string;
      }>;
      note?: string;
    };
    response: {
      id: string;
      code: string;
      status: "scheduled" | "searching" | "assigned" | "arrived_pickup" | "picked_up" | "completed" | "no_driver_found" | "cancelled";
      service: {
        id: string;
        kind: "delivery" | "ride" | "driver_hire" | "moving" | "charter" | "on_site";
        name: string;
        code: string;
        category: "delivery" | "transport" | "rental" | "bike" | "car" | "driver" | "intercity" | "handyman" | "labor";
        vehicleType: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
      };
      steps: {
        arrive: string;
        pickUp: string;
        complete: string;
        inProgress: string;
      };
      paymentMethod: "cash" | "wallet";
      scheduledAt: null | string;
      pickup: {
        lat: number;
        lng: number;
        address: string;
        contactName: null | string;
        contactPhone: null | string;
        note: null | string;
      };
      stops: Array<{
        id: string;
        seq: number;
        lat: number;
        lng: number;
        address: string;
        contactName: null | string;
        contactPhone: null | string;
        note: null | string;
        codAmount: number;
        status: "pending" | "failed" | "arrived" | "delivered" | "returned";
        arrivedAt: null | string;
        completedAt: null | string;
        failReason: null | string;
      }>;
      returnToPickup: boolean;
      durationMinutes: null | number;
      note: null | string;
      addons: Array<{
        id: string;
        name: string;
        price: number;
      }>;
      distanceMeters: number;
      durationSeconds: null | number;
      routePolyline: null | string;
      price: {
        lines: Array<{
          code: string;
          label: string;
          amount: number;
        }>;
        fare: number;
        discountable: number;
        discount: number;
        serviceTotal: number;
        platformFee: number;
        tip: number;
        total: number;
      };
      finalPrice: null | {
        lines: Array<{
          code: string;
          label: string;
          amount: number;
        }>;
        fare: number;
        discountable: number;
        discount: number;
        serviceTotal: number;
        platformFee: number;
        tip: number;
        total: number;
      };
      total: number;
      codTotal: number;
      codCollected: number;
      tip: number;
      debtAmount: number;
      cashToCollect: number;
      walletHeld: number;
      timeline: {
        createdAt: string;
        searchStartedAt: null | string;
        searchDeadlineAt: null | string;
        assignedAt: null | string;
        arrivedPickupAt: null | string;
        pickedUpAt: null | string;
        completedAt: null | string;
        cancelledAt: null | string;
      };
      cancellation: null | {
        by: null | "customer" | "partner" | "staff" | "system";
        reason: null | {
          id: string;
          label: string;
        };
        note: null | string;
        fee: number;
      };
      partner: null | {
        id: string;
        code: string;
        fullName: string;
        phone: string;
        photoUrl: null | string;
        rating: {
          average: null | number;
          count: number;
        };
      };
      vehicle: null | {
        id: string;
        type: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        model: null | string;
        plate: string;
        brand: null | string;
        color: null | string;
        seats: null | number;
      };
      partnerLocation: null | {
        lat: number;
        lng: number;
        heading: null | number;
        at: string;
      };
      customer: null | {
        id: string;
        code: string;
        phone: string;
        fullName: string;
      };
      proofs: Array<{
        fileId: string;
        kind: "delivery" | "pickup" | "cancel";
        stopId: null | string;
        url: null | string;
      }>;
      allowedActions: Array<"cancel" | "start_search" | "accept" | "search_timeout" | "retry" | "arrive" | "pick_up" | "complete" | "release">;
      rating: null | {
        createdAt: string;
        stars: number;
        tags: string[];
        comment: null | string;
      };
      canRate: boolean;
      cancelFreeUntil: null | string;
      cancelFeeIfNow?: number;
    };
  };
  'GET /v1/customer/orders/:id': {
    params: { id: string };
    response: {
      id: string;
      code: string;
      status: "scheduled" | "searching" | "assigned" | "arrived_pickup" | "picked_up" | "completed" | "no_driver_found" | "cancelled";
      service: {
        id: string;
        kind: "delivery" | "ride" | "driver_hire" | "moving" | "charter" | "on_site";
        name: string;
        code: string;
        category: "delivery" | "transport" | "rental" | "bike" | "car" | "driver" | "intercity" | "handyman" | "labor";
        vehicleType: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
      };
      steps: {
        arrive: string;
        pickUp: string;
        complete: string;
        inProgress: string;
      };
      paymentMethod: "cash" | "wallet";
      scheduledAt: null | string;
      pickup: {
        lat: number;
        lng: number;
        address: string;
        contactName: null | string;
        contactPhone: null | string;
        note: null | string;
      };
      stops: Array<{
        id: string;
        seq: number;
        lat: number;
        lng: number;
        address: string;
        contactName: null | string;
        contactPhone: null | string;
        note: null | string;
        codAmount: number;
        status: "pending" | "failed" | "arrived" | "delivered" | "returned";
        arrivedAt: null | string;
        completedAt: null | string;
        failReason: null | string;
      }>;
      returnToPickup: boolean;
      durationMinutes: null | number;
      note: null | string;
      addons: Array<{
        id: string;
        name: string;
        price: number;
      }>;
      distanceMeters: number;
      durationSeconds: null | number;
      routePolyline: null | string;
      price: {
        lines: Array<{
          code: string;
          label: string;
          amount: number;
        }>;
        fare: number;
        discountable: number;
        discount: number;
        serviceTotal: number;
        platformFee: number;
        tip: number;
        total: number;
      };
      finalPrice: null | {
        lines: Array<{
          code: string;
          label: string;
          amount: number;
        }>;
        fare: number;
        discountable: number;
        discount: number;
        serviceTotal: number;
        platformFee: number;
        tip: number;
        total: number;
      };
      total: number;
      codTotal: number;
      codCollected: number;
      tip: number;
      debtAmount: number;
      cashToCollect: number;
      walletHeld: number;
      timeline: {
        createdAt: string;
        searchStartedAt: null | string;
        searchDeadlineAt: null | string;
        assignedAt: null | string;
        arrivedPickupAt: null | string;
        pickedUpAt: null | string;
        completedAt: null | string;
        cancelledAt: null | string;
      };
      cancellation: null | {
        by: null | "customer" | "partner" | "staff" | "system";
        reason: null | {
          id: string;
          label: string;
        };
        note: null | string;
        fee: number;
      };
      partner: null | {
        id: string;
        code: string;
        fullName: string;
        phone: string;
        photoUrl: null | string;
        rating: {
          average: null | number;
          count: number;
        };
      };
      vehicle: null | {
        id: string;
        type: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        model: null | string;
        plate: string;
        brand: null | string;
        color: null | string;
        seats: null | number;
      };
      partnerLocation: null | {
        lat: number;
        lng: number;
        heading: null | number;
        at: string;
      };
      customer: null | {
        id: string;
        code: string;
        phone: string;
        fullName: string;
      };
      proofs: Array<{
        fileId: string;
        kind: "delivery" | "pickup" | "cancel";
        stopId: null | string;
        url: null | string;
      }>;
      allowedActions: Array<"cancel" | "start_search" | "accept" | "search_timeout" | "retry" | "arrive" | "pick_up" | "complete" | "release">;
      rating: null | {
        createdAt: string;
        stars: number;
        tags: string[];
        comment: null | string;
      };
      canRate: boolean;
      cancelFreeUntil: null | string;
      cancelFeeIfNow?: number;
    };
  };
  'POST /v1/customer/orders/:id/cancel': {
    params: { id: string };
    body: {
      reasonId?: string;
      note?: string;
      proofFileId?: string;
      maxFee?: number;
    };
    response: {
      id: string;
      code: string;
      status: "scheduled" | "searching" | "assigned" | "arrived_pickup" | "picked_up" | "completed" | "no_driver_found" | "cancelled";
      service: {
        id: string;
        kind: "delivery" | "ride" | "driver_hire" | "moving" | "charter" | "on_site";
        name: string;
        code: string;
        category: "delivery" | "transport" | "rental" | "bike" | "car" | "driver" | "intercity" | "handyman" | "labor";
        vehicleType: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
      };
      steps: {
        arrive: string;
        pickUp: string;
        complete: string;
        inProgress: string;
      };
      paymentMethod: "cash" | "wallet";
      scheduledAt: null | string;
      pickup: {
        lat: number;
        lng: number;
        address: string;
        contactName: null | string;
        contactPhone: null | string;
        note: null | string;
      };
      stops: Array<{
        id: string;
        seq: number;
        lat: number;
        lng: number;
        address: string;
        contactName: null | string;
        contactPhone: null | string;
        note: null | string;
        codAmount: number;
        status: "pending" | "failed" | "arrived" | "delivered" | "returned";
        arrivedAt: null | string;
        completedAt: null | string;
        failReason: null | string;
      }>;
      returnToPickup: boolean;
      durationMinutes: null | number;
      note: null | string;
      addons: Array<{
        id: string;
        name: string;
        price: number;
      }>;
      distanceMeters: number;
      durationSeconds: null | number;
      routePolyline: null | string;
      price: {
        lines: Array<{
          code: string;
          label: string;
          amount: number;
        }>;
        fare: number;
        discountable: number;
        discount: number;
        serviceTotal: number;
        platformFee: number;
        tip: number;
        total: number;
      };
      finalPrice: null | {
        lines: Array<{
          code: string;
          label: string;
          amount: number;
        }>;
        fare: number;
        discountable: number;
        discount: number;
        serviceTotal: number;
        platformFee: number;
        tip: number;
        total: number;
      };
      total: number;
      codTotal: number;
      codCollected: number;
      tip: number;
      debtAmount: number;
      cashToCollect: number;
      walletHeld: number;
      timeline: {
        createdAt: string;
        searchStartedAt: null | string;
        searchDeadlineAt: null | string;
        assignedAt: null | string;
        arrivedPickupAt: null | string;
        pickedUpAt: null | string;
        completedAt: null | string;
        cancelledAt: null | string;
      };
      cancellation: null | {
        by: null | "customer" | "partner" | "staff" | "system";
        reason: null | {
          id: string;
          label: string;
        };
        note: null | string;
        fee: number;
      };
      partner: null | {
        id: string;
        code: string;
        fullName: string;
        phone: string;
        photoUrl: null | string;
        rating: {
          average: null | number;
          count: number;
        };
      };
      vehicle: null | {
        id: string;
        type: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        model: null | string;
        plate: string;
        brand: null | string;
        color: null | string;
        seats: null | number;
      };
      partnerLocation: null | {
        lat: number;
        lng: number;
        heading: null | number;
        at: string;
      };
      customer: null | {
        id: string;
        code: string;
        phone: string;
        fullName: string;
      };
      proofs: Array<{
        fileId: string;
        kind: "delivery" | "pickup" | "cancel";
        stopId: null | string;
        url: null | string;
      }>;
      allowedActions: Array<"cancel" | "start_search" | "accept" | "search_timeout" | "retry" | "arrive" | "pick_up" | "complete" | "release">;
      rating: null | {
        createdAt: string;
        stars: number;
        tags: string[];
        comment: null | string;
      };
      canRate: boolean;
      cancelFreeUntil: null | string;
      cancelFeeIfNow?: number;
    };
  };
  /** Đánh giá tài xế (1–5 sao, nhãn, nhận xét) — một lần, trong 7 ngày sau khi hoàn tất */
  'POST /v1/customer/orders/:id/rating': {
    params: { id: string };
    body: {
      stars: number;
      tags?: string[];
      comment?: string;
    };
    response: {
      stars: number;
      tags: string[];
      comment: null | string;
      createdAt: string;
    };
  };
  'POST /v1/customer/orders/:id/retry': {
    params: { id: string };
    response: {
      id: string;
      code: string;
      status: "scheduled" | "searching" | "assigned" | "arrived_pickup" | "picked_up" | "completed" | "no_driver_found" | "cancelled";
      service: {
        id: string;
        kind: "delivery" | "ride" | "driver_hire" | "moving" | "charter" | "on_site";
        name: string;
        code: string;
        category: "delivery" | "transport" | "rental" | "bike" | "car" | "driver" | "intercity" | "handyman" | "labor";
        vehicleType: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
      };
      steps: {
        arrive: string;
        pickUp: string;
        complete: string;
        inProgress: string;
      };
      paymentMethod: "cash" | "wallet";
      scheduledAt: null | string;
      pickup: {
        lat: number;
        lng: number;
        address: string;
        contactName: null | string;
        contactPhone: null | string;
        note: null | string;
      };
      stops: Array<{
        id: string;
        seq: number;
        lat: number;
        lng: number;
        address: string;
        contactName: null | string;
        contactPhone: null | string;
        note: null | string;
        codAmount: number;
        status: "pending" | "failed" | "arrived" | "delivered" | "returned";
        arrivedAt: null | string;
        completedAt: null | string;
        failReason: null | string;
      }>;
      returnToPickup: boolean;
      durationMinutes: null | number;
      note: null | string;
      addons: Array<{
        id: string;
        name: string;
        price: number;
      }>;
      distanceMeters: number;
      durationSeconds: null | number;
      routePolyline: null | string;
      price: {
        lines: Array<{
          code: string;
          label: string;
          amount: number;
        }>;
        fare: number;
        discountable: number;
        discount: number;
        serviceTotal: number;
        platformFee: number;
        tip: number;
        total: number;
      };
      finalPrice: null | {
        lines: Array<{
          code: string;
          label: string;
          amount: number;
        }>;
        fare: number;
        discountable: number;
        discount: number;
        serviceTotal: number;
        platformFee: number;
        tip: number;
        total: number;
      };
      total: number;
      codTotal: number;
      codCollected: number;
      tip: number;
      debtAmount: number;
      cashToCollect: number;
      walletHeld: number;
      timeline: {
        createdAt: string;
        searchStartedAt: null | string;
        searchDeadlineAt: null | string;
        assignedAt: null | string;
        arrivedPickupAt: null | string;
        pickedUpAt: null | string;
        completedAt: null | string;
        cancelledAt: null | string;
      };
      cancellation: null | {
        by: null | "customer" | "partner" | "staff" | "system";
        reason: null | {
          id: string;
          label: string;
        };
        note: null | string;
        fee: number;
      };
      partner: null | {
        id: string;
        code: string;
        fullName: string;
        phone: string;
        photoUrl: null | string;
        rating: {
          average: null | number;
          count: number;
        };
      };
      vehicle: null | {
        id: string;
        type: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        model: null | string;
        plate: string;
        brand: null | string;
        color: null | string;
        seats: null | number;
      };
      partnerLocation: null | {
        lat: number;
        lng: number;
        heading: null | number;
        at: string;
      };
      customer: null | {
        id: string;
        code: string;
        phone: string;
        fullName: string;
      };
      proofs: Array<{
        fileId: string;
        kind: "delivery" | "pickup" | "cancel";
        stopId: null | string;
        url: null | string;
      }>;
      allowedActions: Array<"cancel" | "start_search" | "accept" | "search_timeout" | "retry" | "arrive" | "pick_up" | "complete" | "release">;
      rating: null | {
        createdAt: string;
        stars: number;
        tags: string[];
        comment: null | string;
      };
      canRate: boolean;
      cancelFreeUntil: null | string;
      cancelFeeIfNow?: number;
    };
  };
  /** Toạ độ + địa chỉ đầy đủ của gợi ý đã chọn */
  'GET /v1/customer/places/:placeId': {
    params: { placeId: string };
    query?: {
      sessionToken?: string;
    };
    response: {
      placeId: string;
      name: null | string;
      address: string;
      lat: number;
      lng: number;
    };
  };
  /** Gợi ý theo chữ gõ (tối đa 8), ưu tiên gần vị trí gửi kèm. Dùng chung `sessionToken` cho cả lượt gõ + lần chọn. */
  'GET /v1/customer/places/autocomplete': {
    query: {
      q: string;
      lat?: number;
      lng?: number;
      sessionToken?: string;
    };
    response: {
      items: Array<{
        placeId: string;
        title: string;
        subtitle: null | string;
        distanceMeters: null | number;
      }>;
      source: string;
    };
  };
  /** Đảo toạ độ: vị trí ghim → địa chỉ chữ (toạ độ giữ nguyên như gửi lên) */
  'GET /v1/customer/places/reverse': {
    query: {
      lat: number;
      lng: number;
    };
    response: {
      placeId: string;
      name: null | string;
      address: string;
      lat: number;
      lng: number;
    };
  };
  'POST /v1/customer/quotes': {
    body: {
      serviceId: string;
      pickup: {
        lat: number;
        lng: number;
        address: string;
      };
      stops?: Array<{
        lat: number;
        lng: number;
        address: string;
        codAmount?: number;
        weightTierId?: null | string;
      }>;
      returnToPickup?: boolean;
      scheduledAt?: null | string;
      durationMinutes?: number;
      addonIds?: string[];
      tip?: number;
      couponCode?: string;
    };
    response: {
      id: string;
      expiresAt: string;
      service: {
        id: string;
        code: string;
        name: string;
      };
      pricePlanVersion: number;
      scheduledAt: null | string;
      distanceMeters: number;
      durationSeconds: null | number;
      distanceSource: "none" | "goong" | "estimate";
      routePolyline: null | string;
      price: {
        lines: Array<{
          code: string;
          label: string;
          amount: number;
        }>;
        fare: number;
        discountable: number;
        discount: number;
        serviceTotal: number;
        platformFee: number;
        tip: number;
        total: number;
      };
      coupon?: null | {
        code: string;
        name: string;
        discount: number;
      };
    };
  };
  'GET /v1/customer/quotes/:id': {
    params: { id: string };
    response: {
      id: string;
      expiresAt: string;
      service: {
        id: string;
        code: string;
        name: string;
      };
      pricePlanVersion: number;
      scheduledAt: null | string;
      distanceMeters: number;
      durationSeconds: null | number;
      distanceSource: "none" | "goong" | "estimate";
      routePolyline: null | string;
      price: {
        lines: Array<{
          code: string;
          label: string;
          amount: number;
        }>;
        fare: number;
        discountable: number;
        discount: number;
        serviceTotal: number;
        platformFee: number;
        tip: number;
        total: number;
      };
      coupon?: null | {
        code: string;
        name: string;
        discount: number;
      };
    };
  };
  'GET /v1/customer/wallet': {
    response: {
      topupProviders: Array<"vnpay" | "mock">;
      balance: number;
      available: number;
      debt: number;
    };
  };
  'GET /v1/customer/wallet/entries': {
    query?: {
      page?: number;
      pageSize?: number;
    };
    response: {
      items: Array<{
        id: string;
        amount: number;
        balanceAfter: number;
        type: "topup" | "order_hold" | "order_settle" | "order_refund" | "cancel_fee" | "withdrawal_request" | "withdrawal_paid" | "withdrawal_rejected" | "adjustment" | "affiliate_accrual" | "affiliate_payout" | "affiliate_forfeit" | "intercity_hold" | "intercity_refund" | "intercity_settle";
        description: string;
        transactionId: string;
        order: null | {
          id: string;
          code: string;
        };
        createdAt: string;
      }>;
      page: number;
      pageSize: number;
      total: number;
    };
  };
  /** Tạo lần nạp → mở `paymentUrl`; sau khi quay về app, gọi GET topups/:id xem kết quả */
  'POST /v1/customer/wallet/topups': {
    body: {
      amount: number;
      provider?: "vnpay" | "mock";
    };
    response: {
      id: string;
      reference: string;
      provider: "vnpay" | "mock";
      amount: number;
      status: string;
      expiresAt: string;
      paidAt: null | string;
      createdAt: string;
      paymentUrl: null | string;
    };
  };
  'GET /v1/customer/wallet/topups/:id': {
    params: { id: string };
    response: {
      id: string;
      reference: string;
      provider: "vnpay" | "mock";
      amount: number;
      status: string;
      expiresAt: string;
      paidAt: null | string;
      createdAt: string;
      paymentUrl: null | string;
    };
  };
  /** Mã giới thiệu, cấp, số F1/F2/F3, thưởng tạm tính / đã nhận, chính sách đang áp */
  'GET /v1/partner/affiliate': {
    response: ({
      joined: boolean;
      tree: "customer" | "partner";
      message: string;
    }) | ({
      joined: boolean;
      tree: "customer" | "partner";
      code: string;
      level: {
        key: string;
        name: string;
      };
      nextLevel: null | {
        key: string;
        name: string;
        need: {
          f1: number;
          f2: number;
          f3: number;
        };
      };
      counts: {
        f1: number;
        f2: number;
        f3: number;
      };
      referrer: null | {
        code: string;
        fullName: string;
      };
      canSetReferrer: boolean;
      joinedAt: string;
      earnings: {
        thisMonthPending: number;
        pending: number;
        paid: number;
        forfeited: number;
      };
      policy: {
        commissionBps: number[];
        levels: Array<{
          key: string;
          name: string;
          minF1: number;
          minF2: number;
          minF3: number;
        }>;
        maxF1: number;
        payout: {
          minMonthlyOrders: number;
          minMonthlyAmount: number;
          minSupportPoints: number;
        };
      };
    });
  };
  'GET /v1/partner/affiliate/earnings': {
    query?: {
      page?: number;
      pageSize?: number;
    };
    response: {
      items: Array<{
        id: string;
        orderCode: string;
        depth: number;
        amount: number;
        month: string;
        status: "accrued" | "paid" | "forfeited";
        createdAt: string;
      }>;
      page: number;
      pageSize: number;
      total: number;
    };
  };
  'GET /v1/partner/affiliate/members': {
    query?: {
      page?: number;
      pageSize?: number;
      depth?: number;
    };
    response: {
      items: Array<{
        memberId: string;
        code: string;
        fullName: string;
        phone: string;
        active: boolean;
        level: string;
        f1Count: number;
        joinedAt: string;
      }>;
      page: number;
      pageSize: number;
      total: number;
    };
  };
  /** Nhập mã người giới thiệu (khi chưa có, trong thời hạn chính sách cho phép) */
  'POST /v1/partner/affiliate/referrer': {
    body: {
      code: string;
    };
    response: ({
      joined: boolean;
      tree: "customer" | "partner";
      message: string;
    }) | ({
      joined: boolean;
      tree: "customer" | "partner";
      code: string;
      level: {
        key: string;
        name: string;
      };
      nextLevel: null | {
        key: string;
        name: string;
        need: {
          f1: number;
          f2: number;
          f3: number;
        };
      };
      counts: {
        f1: number;
        f2: number;
        f3: number;
      };
      referrer: null | {
        code: string;
        fullName: string;
      };
      canSetReferrer: boolean;
      joinedAt: string;
      earnings: {
        thisMonthPending: number;
        pending: number;
        paid: number;
        forfeited: number;
      };
      policy: {
        commissionBps: number[];
        levels: Array<{
          key: string;
          name: string;
          minF1: number;
          minF2: number;
          minF3: number;
        }>;
        maxF1: number;
        payout: {
          minMonthlyOrders: number;
          minMonthlyAmount: number;
          minSupportPoints: number;
        };
      };
    });
  };
  /** Xem trước người giới thiệu theo mã (trước khi nhập) */
  'GET /v1/partner/affiliate/referrer-preview': {
    query: {
      code: string;
    };
    response: {
      code: string;
      fullName: string;
      level: {
        key: string;
        name: string;
      };
      f1Count: number;
      full: boolean;
    };
  };
  'GET /v1/partner/availability': {
    response: {
      online: boolean;
      activeVehicleId: null | string;
      onlineChangedAt: null | string;
      services: Array<{
        serviceId: string;
        name: string;
      }>;
      eligibleVehicleIds: string[];
    };
  };
  /** Bật/tắt nhận đơn */
  'PUT /v1/partner/availability': {
    body: {
      online: boolean;
      vehicleId?: null | string;
    };
    response: {
      online: boolean;
      activeVehicleId: null | string;
      onlineChangedAt: null | string;
      services: Array<{
        serviceId: string;
        name: string;
      }>;
      eligibleVehicleIds: string[];
    };
  };
  'PUT /v1/partner/devices/:deviceId': {
    params: { deviceId: string };
    body: {
      platform: "ios" | "android" | "web";
      appVersion?: string;
      osVersion?: string;
      model?: string;
      pushToken?: null | string;
      pushEnabled?: boolean;
    };
    response: {
      platform: "ios" | "android" | "web";
      pushEnabled: boolean;
      deviceId: string;
      lastSeenAt: string;
    };
  };
  'DELETE /v1/partner/devices/:deviceId': {
    params: { deviceId: string };
    response: void;
  };
  'POST /v1/partner/documents': {
    body: {
      type: "other" | "id_card" | "portrait" | "driver_license" | "judicial_record" | "professional_certificate" | "business_license" | "vehicle_registration" | "vehicle_insurance" | "vehicle_inspection" | "vehicle_photos";
      files: {
        [key: string]: string;
      };
      number?: null | string;
      licenseClasses?: string[];
      issuedOn?: null | string;
      issuedPlace?: null | string;
      expiresOn?: null | string;
      note?: null | string;
      vehicleId?: null | string;
    };
    response: {
      status: "active" | "suspended" | "deleted" | "pending_profile" | "pending_review" | "changes_requested" | "rejected";
      profile: null | {
        kind: "individual" | "moving_team" | "bus_company";
        gender: null | "other" | "male" | "female";
        dateOfBirth: null | string;
        city: null | string;
        address: null | string;
        organizationName: null | string;
        taxCode: null | string;
        teamSize: null | number;
        fleetSize: null | number;
        serviceArea: null | string;
        note: null | string;
        languages: string[];
        acceptCod: boolean;
        autoAccept: boolean;
        submittedAt: null | string;
        firstApprovedAt: null | string;
      };
      editable: boolean;
      canChangeKind: boolean;
      canSubmit: boolean;
      blockers: string[];
      requirements: Array<{
        key: string;
        kind: "vehicle" | "document";
        documentType: null | "other" | "id_card" | "portrait" | "driver_license" | "judicial_record" | "professional_certificate" | "business_license" | "vehicle_registration" | "vehicle_insurance" | "vehicle_inspection" | "vehicle_photos";
        vehicleId: null | string;
        label: string;
        reason: string;
        required: boolean;
        state: "rejected" | "expired" | "pending" | "approved" | "missing" | "insufficient";
        message: null | string;
      }>;
      eligibility: Array<{
        serviceId: string;
        eligible: boolean;
        vehicleIds: string[];
        problems: string[];
      }>;
      documents: Array<{
        id: string;
        type: "other" | "id_card" | "portrait" | "driver_license" | "judicial_record" | "professional_certificate" | "business_license" | "vehicle_registration" | "vehicle_insurance" | "vehicle_inspection" | "vehicle_photos";
        vehicleId: null | string;
        number: null | string;
        licenseClasses: string[];
        issuedOn: null | string;
        issuedPlace: null | string;
        expiresOn: null | string;
        note: null | string;
        status: "rejected" | "pending" | "approved" | "superseded" | "removed";
        reviewNote: null | string;
        reviewedAt: null | string;
        createdAt: string;
        version: string;
        files: Array<{
          slot: string;
          fileId: string;
          contentType: string;
          size: number;
          url: null | string;
        }>;
      }>;
      vehicles: Array<{
        id: string;
        type: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        plate: string;
        brand: null | string;
        model: null | string;
        color: null | string;
        year: null | number;
        seats: null | number;
        loadKg: null | number;
        ownerName: null | string;
        status: "rejected" | "pending" | "approved" | "superseded" | "removed";
        reviewNote: null | string;
        reviewedAt: null | string;
        createdAt: string;
        version: string;
      }>;
      services: Array<{
        serviceId: string;
        code: string;
        name: string;
        category: "delivery" | "transport" | "rental" | "bike" | "car" | "driver" | "intercity" | "handyman" | "labor";
        kind: "delivery" | "ride" | "driver_hire" | "moving" | "charter" | "on_site";
        vehicleType: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        vehicleSeats: null | number;
        vehicleLoadKg: null | number;
        serviceStatus: "active" | "draft" | "paused" | "archived";
        status: "rejected" | "pending" | "approved" | "superseded" | "removed";
        enabled: boolean;
        reviewNote: null | string;
        reviewedAt: null | string;
        version: string;
      }>;
      lastReview: null | {
        event: "changes_requested" | "rejected" | "approved" | "submitted" | "withdrawn" | "reopened" | "items_reviewed";
        note: null | string;
        at: string;
      };
      availability: {
        online: boolean;
        activeVehicleId: null | string;
      };
    };
  };
  'DELETE /v1/partner/documents/:id': {
    params: { id: string };
    response: {
      status: "active" | "suspended" | "deleted" | "pending_profile" | "pending_review" | "changes_requested" | "rejected";
      profile: null | {
        kind: "individual" | "moving_team" | "bus_company";
        gender: null | "other" | "male" | "female";
        dateOfBirth: null | string;
        city: null | string;
        address: null | string;
        organizationName: null | string;
        taxCode: null | string;
        teamSize: null | number;
        fleetSize: null | number;
        serviceArea: null | string;
        note: null | string;
        languages: string[];
        acceptCod: boolean;
        autoAccept: boolean;
        submittedAt: null | string;
        firstApprovedAt: null | string;
      };
      editable: boolean;
      canChangeKind: boolean;
      canSubmit: boolean;
      blockers: string[];
      requirements: Array<{
        key: string;
        kind: "vehicle" | "document";
        documentType: null | "other" | "id_card" | "portrait" | "driver_license" | "judicial_record" | "professional_certificate" | "business_license" | "vehicle_registration" | "vehicle_insurance" | "vehicle_inspection" | "vehicle_photos";
        vehicleId: null | string;
        label: string;
        reason: string;
        required: boolean;
        state: "rejected" | "expired" | "pending" | "approved" | "missing" | "insufficient";
        message: null | string;
      }>;
      eligibility: Array<{
        serviceId: string;
        eligible: boolean;
        vehicleIds: string[];
        problems: string[];
      }>;
      documents: Array<{
        id: string;
        type: "other" | "id_card" | "portrait" | "driver_license" | "judicial_record" | "professional_certificate" | "business_license" | "vehicle_registration" | "vehicle_insurance" | "vehicle_inspection" | "vehicle_photos";
        vehicleId: null | string;
        number: null | string;
        licenseClasses: string[];
        issuedOn: null | string;
        issuedPlace: null | string;
        expiresOn: null | string;
        note: null | string;
        status: "rejected" | "pending" | "approved" | "superseded" | "removed";
        reviewNote: null | string;
        reviewedAt: null | string;
        createdAt: string;
        version: string;
        files: Array<{
          slot: string;
          fileId: string;
          contentType: string;
          size: number;
          url: null | string;
        }>;
      }>;
      vehicles: Array<{
        id: string;
        type: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        plate: string;
        brand: null | string;
        model: null | string;
        color: null | string;
        year: null | number;
        seats: null | number;
        loadKg: null | number;
        ownerName: null | string;
        status: "rejected" | "pending" | "approved" | "superseded" | "removed";
        reviewNote: null | string;
        reviewedAt: null | string;
        createdAt: string;
        version: string;
      }>;
      services: Array<{
        serviceId: string;
        code: string;
        name: string;
        category: "delivery" | "transport" | "rental" | "bike" | "car" | "driver" | "intercity" | "handyman" | "labor";
        kind: "delivery" | "ride" | "driver_hire" | "moving" | "charter" | "on_site";
        vehicleType: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        vehicleSeats: null | number;
        vehicleLoadKg: null | number;
        serviceStatus: "active" | "draft" | "paused" | "archived";
        status: "rejected" | "pending" | "approved" | "superseded" | "removed";
        enabled: boolean;
        reviewNote: null | string;
        reviewedAt: null | string;
        version: string;
      }>;
      lastReview: null | {
        event: "changes_requested" | "rejected" | "approved" | "submitted" | "withdrawn" | "reopened" | "items_reviewed";
        note: null | string;
        at: string;
      };
      availability: {
        online: boolean;
        activeVehicleId: null | string;
      };
    };
  };
  'PATCH /v1/partner/documents/:id': {
    params: { id: string };
    body: {
      number?: null | string;
      licenseClasses?: string[];
      issuedOn?: null | string;
      issuedPlace?: null | string;
      expiresOn?: null | string;
      note?: null | string;
      files?: {
        [key: string]: string;
      };
    };
    response: {
      status: "active" | "suspended" | "deleted" | "pending_profile" | "pending_review" | "changes_requested" | "rejected";
      profile: null | {
        kind: "individual" | "moving_team" | "bus_company";
        gender: null | "other" | "male" | "female";
        dateOfBirth: null | string;
        city: null | string;
        address: null | string;
        organizationName: null | string;
        taxCode: null | string;
        teamSize: null | number;
        fleetSize: null | number;
        serviceArea: null | string;
        note: null | string;
        languages: string[];
        acceptCod: boolean;
        autoAccept: boolean;
        submittedAt: null | string;
        firstApprovedAt: null | string;
      };
      editable: boolean;
      canChangeKind: boolean;
      canSubmit: boolean;
      blockers: string[];
      requirements: Array<{
        key: string;
        kind: "vehicle" | "document";
        documentType: null | "other" | "id_card" | "portrait" | "driver_license" | "judicial_record" | "professional_certificate" | "business_license" | "vehicle_registration" | "vehicle_insurance" | "vehicle_inspection" | "vehicle_photos";
        vehicleId: null | string;
        label: string;
        reason: string;
        required: boolean;
        state: "rejected" | "expired" | "pending" | "approved" | "missing" | "insufficient";
        message: null | string;
      }>;
      eligibility: Array<{
        serviceId: string;
        eligible: boolean;
        vehicleIds: string[];
        problems: string[];
      }>;
      documents: Array<{
        id: string;
        type: "other" | "id_card" | "portrait" | "driver_license" | "judicial_record" | "professional_certificate" | "business_license" | "vehicle_registration" | "vehicle_insurance" | "vehicle_inspection" | "vehicle_photos";
        vehicleId: null | string;
        number: null | string;
        licenseClasses: string[];
        issuedOn: null | string;
        issuedPlace: null | string;
        expiresOn: null | string;
        note: null | string;
        status: "rejected" | "pending" | "approved" | "superseded" | "removed";
        reviewNote: null | string;
        reviewedAt: null | string;
        createdAt: string;
        version: string;
        files: Array<{
          slot: string;
          fileId: string;
          contentType: string;
          size: number;
          url: null | string;
        }>;
      }>;
      vehicles: Array<{
        id: string;
        type: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        plate: string;
        brand: null | string;
        model: null | string;
        color: null | string;
        year: null | number;
        seats: null | number;
        loadKg: null | number;
        ownerName: null | string;
        status: "rejected" | "pending" | "approved" | "superseded" | "removed";
        reviewNote: null | string;
        reviewedAt: null | string;
        createdAt: string;
        version: string;
      }>;
      services: Array<{
        serviceId: string;
        code: string;
        name: string;
        category: "delivery" | "transport" | "rental" | "bike" | "car" | "driver" | "intercity" | "handyman" | "labor";
        kind: "delivery" | "ride" | "driver_hire" | "moving" | "charter" | "on_site";
        vehicleType: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        vehicleSeats: null | number;
        vehicleLoadKg: null | number;
        serviceStatus: "active" | "draft" | "paused" | "archived";
        status: "rejected" | "pending" | "approved" | "superseded" | "removed";
        enabled: boolean;
        reviewNote: null | string;
        reviewedAt: null | string;
        version: string;
      }>;
      lastReview: null | {
        event: "changes_requested" | "rejected" | "approved" | "submitted" | "withdrawn" | "reopened" | "items_reviewed";
        note: null | string;
        at: string;
      };
      availability: {
        online: boolean;
        activeVehicleId: null | string;
      };
    };
  };
  /** Xin link upload. Sau đó PUT file lên `url` với đúng header `headers`, rồi gọi /complete */
  'POST /v1/partner/files': {
    body: {
      purpose: "partner_document" | "avatar" | "order_proof";
      contentType: string;
      size: number;
    };
    response: {
      fileId: string;
      url: string;
      method: "PUT";
      headers: {
        [key: string]: string;
      };
      expiresAt: string;
    };
  };
  'GET /v1/partner/files/:id': {
    params: { id: string };
    response: {
      id: string;
      purpose: string;
      contentType: string;
      size: number;
      status: string;
      createdAt: string;
      url: null | string;
    };
  };
  'POST /v1/partner/files/:id/complete': {
    params: { id: string };
    response: {
      id: string;
      purpose: string;
      contentType: string;
      size: number;
      status: string;
      createdAt: string;
      url: null | string;
    };
  };
  'GET /v1/partner/intercity/cities': {
    response: Array<{
      id: string;
      createdAt: string;
      updatedAt: string;
      name: string;
      status: "active" | "inactive";
      sortOrder: number;
      region: null | string;
      keywords: string[];
      stationName: string;
      stationAddress: string;
      stationLat: number;
      stationLng: number;
    }>;
  };
  'GET /v1/partner/intercity/routes': {
    response: Array<{
      _count: {
        trips: number;
      };
      fromCity: {
        id: string;
        createdAt: string;
        updatedAt: string;
        name: string;
        status: "active" | "inactive";
        sortOrder: number;
        region: null | string;
        keywords: string[];
        stationName: string;
        stationAddress: string;
        stationLat: number;
        stationLng: number;
      };
      toCity: {
        id: string;
        createdAt: string;
        updatedAt: string;
        name: string;
        status: "active" | "inactive";
        sortOrder: number;
        region: null | string;
        keywords: string[];
        stationName: string;
        stationAddress: string;
        stationLat: number;
        stationLng: number;
      };
      id: string;
      note: null | string;
      createdAt: string;
      updatedAt: string;
      partnerId: string;
      status: "active" | "inactive";
      durationMinutes: number;
      fromCityId: string;
      toCityId: string;
    }>;
  };
  'POST /v1/partner/intercity/routes': {
    body: {
      fromCityId: string;
      toCityId: string;
      durationMinutes: number;
      note?: null | string;
      status?: "active" | "inactive";
    };
    response: {
      fromCity: {
        id: string;
        createdAt: string;
        updatedAt: string;
        name: string;
        status: "active" | "inactive";
        sortOrder: number;
        region: null | string;
        keywords: string[];
        stationName: string;
        stationAddress: string;
        stationLat: number;
        stationLng: number;
      };
      toCity: {
        id: string;
        createdAt: string;
        updatedAt: string;
        name: string;
        status: "active" | "inactive";
        sortOrder: number;
        region: null | string;
        keywords: string[];
        stationName: string;
        stationAddress: string;
        stationLat: number;
        stationLng: number;
      };
      id: string;
      note: null | string;
      createdAt: string;
      updatedAt: string;
      partnerId: string;
      status: "active" | "inactive";
      durationMinutes: number;
      fromCityId: string;
      toCityId: string;
    };
  };
  'PATCH /v1/partner/intercity/routes/:id': {
    params: { id: string };
    body: {
      fromCityId?: string;
      toCityId?: string;
      durationMinutes?: number;
      note?: null | string;
      status?: "active" | "inactive";
    };
    response: {
      fromCity: {
        id: string;
        createdAt: string;
        updatedAt: string;
        name: string;
        status: "active" | "inactive";
        sortOrder: number;
        region: null | string;
        keywords: string[];
        stationName: string;
        stationAddress: string;
        stationLat: number;
        stationLng: number;
      };
      toCity: {
        id: string;
        createdAt: string;
        updatedAt: string;
        name: string;
        status: "active" | "inactive";
        sortOrder: number;
        region: null | string;
        keywords: string[];
        stationName: string;
        stationAddress: string;
        stationLat: number;
        stationLng: number;
      };
      id: string;
      note: null | string;
      createdAt: string;
      updatedAt: string;
      partnerId: string;
      status: "active" | "inactive";
      durationMinutes: number;
      fromCityId: string;
      toCityId: string;
    };
  };
  'GET /v1/partner/intercity/trips': {
    query?: {
      from?: string;
      status?: "scheduled" | "completed" | "cancelled" | "departed";
    };
    response: Array<{
      id: string;
      kind: "bus" | "carpool";
      note: null | string;
      createdAt: string;
      updatedAt: string;
      partnerId: string;
      status: "scheduled" | "completed" | "cancelled" | "departed";
      commissionBps: number;
      vehicleId: string;
      route: {
        fromCity: {
          id: string;
          createdAt: string;
          updatedAt: string;
          name: string;
          status: "active" | "inactive";
          sortOrder: number;
          region: null | string;
          keywords: string[];
          stationName: string;
          stationAddress: string;
          stationLat: number;
          stationLng: number;
        };
        toCity: {
          id: string;
          createdAt: string;
          updatedAt: string;
          name: string;
          status: "active" | "inactive";
          sortOrder: number;
          region: null | string;
          keywords: string[];
          stationName: string;
          stationAddress: string;
          stationLat: number;
          stationLng: number;
        };
        id: string;
        note: null | string;
        createdAt: string;
        updatedAt: string;
        partnerId: string;
        status: "active" | "inactive";
        durationMinutes: number;
        fromCityId: string;
        toCityId: string;
      };
      vehicle: {
        type: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        model: null | string;
        plate: string;
        brand: null | string;
      };
      routeId: string;
      departAt: string;
      arriveAt: string;
      pricePerSeat: number;
      seatCount: number;
      amenities: string[];
      cargoFee: null | number;
      homePickupFee: null | number;
      homeDropoffFee: null | number;
      salesCloseMinutes: number;
      cancelledReason: null | string;
      seatMap: Array<{
        id: string;
        row: string;
        col: number;
        deck: number;
      }>;
    }>;
  };
  'POST /v1/partner/intercity/trips': {
    body: {
      routeId: string;
      vehicleId: string;
      departAt: string;
      pricePerSeat: number;
      seatMap?: Array<{
        id: string;
        row: string;
        col: number;
        deck?: number;
      }>;
      amenities?: string[];
      cargoFee?: null | number;
      homePickupFee?: null | number;
      homeDropoffFee?: null | number;
      salesCloseMinutes?: number;
      note?: null | string;
    };
    response: {
      id: string;
      kind: "bus" | "carpool";
      note: null | string;
      createdAt: string;
      updatedAt: string;
      partnerId: string;
      status: "scheduled" | "completed" | "cancelled" | "departed";
      commissionBps: number;
      vehicleId: string;
      routeId: string;
      departAt: string;
      arriveAt: string;
      pricePerSeat: number;
      seatCount: number;
      amenities: string[];
      cargoFee: null | number;
      homePickupFee: null | number;
      homeDropoffFee: null | number;
      salesCloseMinutes: number;
      cancelledReason: null | string;
      seatMap: Array<{
        id: string;
        row: string;
        col: number;
        deck: number;
      }>;
    };
  };
  /** Danh sách khách của chuyến */
  'GET /v1/partner/intercity/trips/:id': {
    params: { id: string };
    response: {
      trip: {
        id: string;
        kind: "bus" | "carpool";
        note: null | string;
        createdAt: string;
        updatedAt: string;
        partner: {
          id: string;
          code: string;
          phone: string;
          fullName: string;
          profile: null | {
            organizationName: null | string;
          };
        };
        partnerId: string;
        status: "scheduled" | "completed" | "cancelled" | "departed";
        commissionBps: number;
        vehicleId: string;
        route: {
          fromCity: {
            id: string;
            createdAt: string;
            updatedAt: string;
            name: string;
            status: "active" | "inactive";
            sortOrder: number;
            region: null | string;
            keywords: string[];
            stationName: string;
            stationAddress: string;
            stationLat: number;
            stationLng: number;
          };
          toCity: {
            id: string;
            createdAt: string;
            updatedAt: string;
            name: string;
            status: "active" | "inactive";
            sortOrder: number;
            region: null | string;
            keywords: string[];
            stationName: string;
            stationAddress: string;
            stationLat: number;
            stationLng: number;
          };
          id: string;
          note: null | string;
          createdAt: string;
          updatedAt: string;
          partnerId: string;
          status: "active" | "inactive";
          durationMinutes: number;
          fromCityId: string;
          toCityId: string;
        };
        vehicle: {
          type: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
          model: null | string;
          plate: string;
          brand: null | string;
        };
        routeId: string;
        departAt: string;
        arriveAt: string;
        pricePerSeat: number;
        seatCount: number;
        amenities: string[];
        cargoFee: null | number;
        homePickupFee: null | number;
        homeDropoffFee: null | number;
        salesCloseMinutes: number;
        cancelledReason: null | string;
        seatMap: Array<{
          id: string;
          row: string;
          col: number;
          deck: number;
        }>;
      };
      bookings: Array<{
        id: string;
        code: string;
        status: "completed" | "cancelled" | "expired" | "held" | "confirmed";
        seatIds: string[];
        customer: {
          code: string;
          phone: string;
          fullName: string;
        };
        contactName: null | string;
        contactPhone: null | string;
        pickup: {
          type: string;
          address: null | string;
        };
        dropoff: {
          type: string;
          address: null | string;
        };
        withCargo: boolean;
        cargoNote: null | string;
        total: number;
        paymentMethod: null | "cash" | "wallet";
        heldUntil: null | string;
      }>;
      soldSeats: number;
    };
  };
  /** Huỷ chuyến: mọi vé hoàn tiền, báo khách */
  'POST /v1/partner/intercity/trips/:id/cancel': {
    params: { id: string };
    body: {
      reason: string;
    };
    response: {
      id: string;
      status: "scheduled" | "completed" | "cancelled" | "departed";
      departAt: string;
      arriveAt: string;
      cancelledReason: null | string;
    };
  };
  'POST /v1/partner/intercity/trips/:id/complete': {
    params: { id: string };
    response: {
      id: string;
      status: "scheduled" | "completed" | "cancelled" | "departed";
      departAt: string;
      arriveAt: string;
      cancelledReason: null | string;
    };
  };
  'POST /v1/partner/intercity/trips/:id/depart': {
    params: { id: string };
    response: {
      id: string;
      status: "scheduled" | "completed" | "cancelled" | "departed";
      departAt: string;
      arriveAt: string;
      cancelledReason: null | string;
    };
  };
  /** Gửi GPS theo lô (≤ 100 điểm); điểm mới nhất thắng; đang chạy đơn thì lưu vết + đẩy cho khách */
  'POST /v1/partner/locations': {
    body: {
      points: Array<{
        lat: number;
        lng: number;
        recordedAt: string;
        heading?: null | number;
        speed?: null | number;
        accuracy?: null | number;
      }>;
    };
    response: {
      accepted: number;
      rejected: number;
    };
  };
  'GET /v1/partner/me': {
    response: {
      id: string;
      code: string;
      phone: string;
      fullName: string;
      email: null | string;
      avatarUrl: null | string;
      status: string;
      createdAt: string;
    };
  };
  'PATCH /v1/partner/me': {
    body: {
      fullName?: string;
      email?: null | string;
      avatarFileId?: null | string;
    };
    response: {
      id: string;
      code: string;
      phone: string;
      fullName: string;
      email: null | string;
      avatarUrl: null | string;
      status: string;
      createdAt: string;
    };
  };
  'POST /v1/partner/me/passcode': {
    body: {
      currentPasscode: string;
      newPasscode: string;
    };
    response: void;
  };
  'GET /v1/partner/notifications': {
    query?: {
      page?: number;
      pageSize?: number;
    };
    response: {
      unread: number;
      items: Array<{
        id: string;
        type: "order" | "campaign" | "wallet" | "system" | "offer" | "partner_review";
        title: string;
        body: string;
        data: unknown;
        readAt: null | string;
        createdAt: string;
      }>;
      page: number;
      pageSize: number;
      total: number;
    };
  };
  /** Xoá hết hộp thư */
  'DELETE /v1/partner/notifications': {
    response: {
      unread: number;
    };
  };
  /** Xoá một thông báo khỏi hộp thư */
  'DELETE /v1/partner/notifications/:id': {
    params: { id: string };
    response: {
      unread: number;
    };
  };
  'POST /v1/partner/notifications/:id/read': {
    params: { id: string };
    response: {
      unread: number;
    };
  };
  'POST /v1/partner/notifications/read-all': {
    response: {
      unread: number;
    };
  };
  'GET /v1/partner/notifications/unread-count': {
    response: {
      unread: number;
    };
  };
  'GET /v1/partner/offers': {
    response: Array<{
      offerId: string;
      orderId: string;
      expiresAt: string;
      expiresInSeconds: number;
      distanceToPickupMeters: number;
      service: {
        id: string;
        kind: "delivery" | "ride" | "driver_hire" | "moving" | "charter" | "on_site";
        name: string;
      };
      code: string;
      pickup: {
        lat: number;
        lng: number;
        address: string;
      };
      stops: Array<{
        seq: number;
        address: string;
        codAmount: number;
      }>;
      distanceMeters: number;
      total: number;
      codTotal: number;
      paymentMethod: "cash" | "wallet";
      scheduledAt: null | string;
      note: null | string;
    }>;
  };
  'POST /v1/partner/offers/:id/accept': {
    params: { id: string };
    response: {
      id: string;
      code: string;
      status: "scheduled" | "searching" | "assigned" | "arrived_pickup" | "picked_up" | "completed" | "no_driver_found" | "cancelled";
      service: {
        id: string;
        kind: "delivery" | "ride" | "driver_hire" | "moving" | "charter" | "on_site";
        name: string;
        code: string;
        category: "delivery" | "transport" | "rental" | "bike" | "car" | "driver" | "intercity" | "handyman" | "labor";
        vehicleType: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
      };
      steps: {
        arrive: string;
        pickUp: string;
        complete: string;
        inProgress: string;
      };
      paymentMethod: "cash" | "wallet";
      scheduledAt: null | string;
      pickup: {
        lat: number;
        lng: number;
        address: string;
        contactName: null | string;
        contactPhone: null | string;
        note: null | string;
      };
      stops: Array<{
        id: string;
        seq: number;
        lat: number;
        lng: number;
        address: string;
        contactName: null | string;
        contactPhone: null | string;
        note: null | string;
        codAmount: number;
        status: "pending" | "failed" | "arrived" | "delivered" | "returned";
        arrivedAt: null | string;
        completedAt: null | string;
        failReason: null | string;
      }>;
      returnToPickup: boolean;
      durationMinutes: null | number;
      note: null | string;
      addons: Array<{
        id: string;
        name: string;
        price: number;
      }>;
      distanceMeters: number;
      durationSeconds: null | number;
      routePolyline: null | string;
      price: {
        lines: Array<{
          code: string;
          label: string;
          amount: number;
        }>;
        fare: number;
        discountable: number;
        discount: number;
        serviceTotal: number;
        platformFee: number;
        tip: number;
        total: number;
      };
      finalPrice: null | {
        lines: Array<{
          code: string;
          label: string;
          amount: number;
        }>;
        fare: number;
        discountable: number;
        discount: number;
        serviceTotal: number;
        platformFee: number;
        tip: number;
        total: number;
      };
      total: number;
      codTotal: number;
      codCollected: number;
      tip: number;
      debtAmount: number;
      cashToCollect: number;
      walletHeld: number;
      timeline: {
        createdAt: string;
        searchStartedAt: null | string;
        searchDeadlineAt: null | string;
        assignedAt: null | string;
        arrivedPickupAt: null | string;
        pickedUpAt: null | string;
        completedAt: null | string;
        cancelledAt: null | string;
      };
      cancellation: null | {
        by: null | "customer" | "partner" | "staff" | "system";
        reason: null | {
          id: string;
          label: string;
        };
        note: null | string;
        fee: number;
      };
      partner: null | {
        id: string;
        code: string;
        fullName: string;
        phone: string;
        photoUrl: null | string;
        rating: {
          average: null | number;
          count: number;
        };
      };
      vehicle: null | {
        id: string;
        type: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        model: null | string;
        plate: string;
        brand: null | string;
        color: null | string;
        seats: null | number;
      };
      partnerLocation: null | {
        lat: number;
        lng: number;
        heading: null | number;
        at: string;
      };
      customer: null | {
        id: string;
        code: string;
        phone: string;
        fullName: string;
      };
      proofs: Array<{
        fileId: string;
        kind: "delivery" | "pickup" | "cancel";
        stopId: null | string;
        url: null | string;
      }>;
      allowedActions: Array<"cancel" | "start_search" | "accept" | "search_timeout" | "retry" | "arrive" | "pick_up" | "complete" | "release">;
      rating: null | {
        createdAt: string;
        stars: number;
        tags: string[];
        comment: null | string;
      };
      canRate: boolean;
      cancelFreeUntil: null | string;
      cancelFeeIfNow?: number;
    };
  };
  'POST /v1/partner/offers/:id/decline': {
    params: { id: string };
    response: void;
  };
  /** scope: active = đang chạy, history = đã xong / huỷ */
  'GET /v1/partner/orders': {
    query?: {
      page?: number;
      pageSize?: number;
      scope?: "active" | "history";
    };
    response: {
      items: Array<{
        id: string;
        code: string;
        status: "scheduled" | "searching" | "assigned" | "arrived_pickup" | "picked_up" | "completed" | "no_driver_found" | "cancelled";
        service: {
          id: string;
          kind: "delivery" | "ride" | "driver_hire" | "moving" | "charter" | "on_site";
          name: string;
        };
        pickupAddress: string;
        stops: Array<{
          address: string;
          status: "pending" | "failed" | "arrived" | "delivered" | "returned";
          seq: number;
        }>;
        total: number;
        codTotal: number;
        paymentMethod: "cash" | "wallet";
        scheduledAt: null | string;
        createdAt: string;
        completedAt: null | string;
        customer: null | {
          id: string;
          code: string;
          phone: string;
          fullName: string;
        };
        partner: null | {
          id: string;
          code: string;
          phone: string;
          fullName: string;
        };
      }>;
      page: number;
      pageSize: number;
      total: number;
    };
  };
  'GET /v1/partner/orders/:id': {
    params: { id: string };
    response: {
      id: string;
      code: string;
      status: "scheduled" | "searching" | "assigned" | "arrived_pickup" | "picked_up" | "completed" | "no_driver_found" | "cancelled";
      service: {
        id: string;
        kind: "delivery" | "ride" | "driver_hire" | "moving" | "charter" | "on_site";
        name: string;
        code: string;
        category: "delivery" | "transport" | "rental" | "bike" | "car" | "driver" | "intercity" | "handyman" | "labor";
        vehicleType: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
      };
      steps: {
        arrive: string;
        pickUp: string;
        complete: string;
        inProgress: string;
      };
      paymentMethod: "cash" | "wallet";
      scheduledAt: null | string;
      pickup: {
        lat: number;
        lng: number;
        address: string;
        contactName: null | string;
        contactPhone: null | string;
        note: null | string;
      };
      stops: Array<{
        id: string;
        seq: number;
        lat: number;
        lng: number;
        address: string;
        contactName: null | string;
        contactPhone: null | string;
        note: null | string;
        codAmount: number;
        status: "pending" | "failed" | "arrived" | "delivered" | "returned";
        arrivedAt: null | string;
        completedAt: null | string;
        failReason: null | string;
      }>;
      returnToPickup: boolean;
      durationMinutes: null | number;
      note: null | string;
      addons: Array<{
        id: string;
        name: string;
        price: number;
      }>;
      distanceMeters: number;
      durationSeconds: null | number;
      routePolyline: null | string;
      price: {
        lines: Array<{
          code: string;
          label: string;
          amount: number;
        }>;
        fare: number;
        discountable: number;
        discount: number;
        serviceTotal: number;
        platformFee: number;
        tip: number;
        total: number;
      };
      finalPrice: null | {
        lines: Array<{
          code: string;
          label: string;
          amount: number;
        }>;
        fare: number;
        discountable: number;
        discount: number;
        serviceTotal: number;
        platformFee: number;
        tip: number;
        total: number;
      };
      total: number;
      codTotal: number;
      codCollected: number;
      tip: number;
      debtAmount: number;
      cashToCollect: number;
      walletHeld: number;
      timeline: {
        createdAt: string;
        searchStartedAt: null | string;
        searchDeadlineAt: null | string;
        assignedAt: null | string;
        arrivedPickupAt: null | string;
        pickedUpAt: null | string;
        completedAt: null | string;
        cancelledAt: null | string;
      };
      cancellation: null | {
        by: null | "customer" | "partner" | "staff" | "system";
        reason: null | {
          id: string;
          label: string;
        };
        note: null | string;
        fee: number;
      };
      partner: null | {
        id: string;
        code: string;
        fullName: string;
        phone: string;
        photoUrl: null | string;
        rating: {
          average: null | number;
          count: number;
        };
      };
      vehicle: null | {
        id: string;
        type: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        model: null | string;
        plate: string;
        brand: null | string;
        color: null | string;
        seats: null | number;
      };
      partnerLocation: null | {
        lat: number;
        lng: number;
        heading: null | number;
        at: string;
      };
      customer: null | {
        id: string;
        code: string;
        phone: string;
        fullName: string;
      };
      proofs: Array<{
        fileId: string;
        kind: "delivery" | "pickup" | "cancel";
        stopId: null | string;
        url: null | string;
      }>;
      allowedActions: Array<"cancel" | "start_search" | "accept" | "search_timeout" | "retry" | "arrive" | "pick_up" | "complete" | "release">;
      rating: null | {
        createdAt: string;
        stars: number;
        tags: string[];
        comment: null | string;
      };
      canRate: boolean;
      cancelFreeUntil: null | string;
      cancelFeeIfNow?: number;
    };
  };
  'POST /v1/partner/orders/:id/arrive': {
    params: { id: string };
    body: {
      lat?: number;
      lng?: number;
    };
    response: {
      id: string;
      code: string;
      status: "scheduled" | "searching" | "assigned" | "arrived_pickup" | "picked_up" | "completed" | "no_driver_found" | "cancelled";
      service: {
        id: string;
        kind: "delivery" | "ride" | "driver_hire" | "moving" | "charter" | "on_site";
        name: string;
        code: string;
        category: "delivery" | "transport" | "rental" | "bike" | "car" | "driver" | "intercity" | "handyman" | "labor";
        vehicleType: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
      };
      steps: {
        arrive: string;
        pickUp: string;
        complete: string;
        inProgress: string;
      };
      paymentMethod: "cash" | "wallet";
      scheduledAt: null | string;
      pickup: {
        lat: number;
        lng: number;
        address: string;
        contactName: null | string;
        contactPhone: null | string;
        note: null | string;
      };
      stops: Array<{
        id: string;
        seq: number;
        lat: number;
        lng: number;
        address: string;
        contactName: null | string;
        contactPhone: null | string;
        note: null | string;
        codAmount: number;
        status: "pending" | "failed" | "arrived" | "delivered" | "returned";
        arrivedAt: null | string;
        completedAt: null | string;
        failReason: null | string;
      }>;
      returnToPickup: boolean;
      durationMinutes: null | number;
      note: null | string;
      addons: Array<{
        id: string;
        name: string;
        price: number;
      }>;
      distanceMeters: number;
      durationSeconds: null | number;
      routePolyline: null | string;
      price: {
        lines: Array<{
          code: string;
          label: string;
          amount: number;
        }>;
        fare: number;
        discountable: number;
        discount: number;
        serviceTotal: number;
        platformFee: number;
        tip: number;
        total: number;
      };
      finalPrice: null | {
        lines: Array<{
          code: string;
          label: string;
          amount: number;
        }>;
        fare: number;
        discountable: number;
        discount: number;
        serviceTotal: number;
        platformFee: number;
        tip: number;
        total: number;
      };
      total: number;
      codTotal: number;
      codCollected: number;
      tip: number;
      debtAmount: number;
      cashToCollect: number;
      walletHeld: number;
      timeline: {
        createdAt: string;
        searchStartedAt: null | string;
        searchDeadlineAt: null | string;
        assignedAt: null | string;
        arrivedPickupAt: null | string;
        pickedUpAt: null | string;
        completedAt: null | string;
        cancelledAt: null | string;
      };
      cancellation: null | {
        by: null | "customer" | "partner" | "staff" | "system";
        reason: null | {
          id: string;
          label: string;
        };
        note: null | string;
        fee: number;
      };
      partner: null | {
        id: string;
        code: string;
        fullName: string;
        phone: string;
        photoUrl: null | string;
        rating: {
          average: null | number;
          count: number;
        };
      };
      vehicle: null | {
        id: string;
        type: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        model: null | string;
        plate: string;
        brand: null | string;
        color: null | string;
        seats: null | number;
      };
      partnerLocation: null | {
        lat: number;
        lng: number;
        heading: null | number;
        at: string;
      };
      customer: null | {
        id: string;
        code: string;
        phone: string;
        fullName: string;
      };
      proofs: Array<{
        fileId: string;
        kind: "delivery" | "pickup" | "cancel";
        stopId: null | string;
        url: null | string;
      }>;
      allowedActions: Array<"cancel" | "start_search" | "accept" | "search_timeout" | "retry" | "arrive" | "pick_up" | "complete" | "release">;
      rating: null | {
        createdAt: string;
        stars: number;
        tags: string[];
        comment: null | string;
      };
      canRate: boolean;
      cancelFreeUntil: null | string;
      cancelFeeIfNow?: number;
    };
  };
  'POST /v1/partner/orders/:id/complete': {
    params: { id: string };
    response: {
      id: string;
      code: string;
      status: "scheduled" | "searching" | "assigned" | "arrived_pickup" | "picked_up" | "completed" | "no_driver_found" | "cancelled";
      service: {
        id: string;
        kind: "delivery" | "ride" | "driver_hire" | "moving" | "charter" | "on_site";
        name: string;
        code: string;
        category: "delivery" | "transport" | "rental" | "bike" | "car" | "driver" | "intercity" | "handyman" | "labor";
        vehicleType: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
      };
      steps: {
        arrive: string;
        pickUp: string;
        complete: string;
        inProgress: string;
      };
      paymentMethod: "cash" | "wallet";
      scheduledAt: null | string;
      pickup: {
        lat: number;
        lng: number;
        address: string;
        contactName: null | string;
        contactPhone: null | string;
        note: null | string;
      };
      stops: Array<{
        id: string;
        seq: number;
        lat: number;
        lng: number;
        address: string;
        contactName: null | string;
        contactPhone: null | string;
        note: null | string;
        codAmount: number;
        status: "pending" | "failed" | "arrived" | "delivered" | "returned";
        arrivedAt: null | string;
        completedAt: null | string;
        failReason: null | string;
      }>;
      returnToPickup: boolean;
      durationMinutes: null | number;
      note: null | string;
      addons: Array<{
        id: string;
        name: string;
        price: number;
      }>;
      distanceMeters: number;
      durationSeconds: null | number;
      routePolyline: null | string;
      price: {
        lines: Array<{
          code: string;
          label: string;
          amount: number;
        }>;
        fare: number;
        discountable: number;
        discount: number;
        serviceTotal: number;
        platformFee: number;
        tip: number;
        total: number;
      };
      finalPrice: null | {
        lines: Array<{
          code: string;
          label: string;
          amount: number;
        }>;
        fare: number;
        discountable: number;
        discount: number;
        serviceTotal: number;
        platformFee: number;
        tip: number;
        total: number;
      };
      total: number;
      codTotal: number;
      codCollected: number;
      tip: number;
      debtAmount: number;
      cashToCollect: number;
      walletHeld: number;
      timeline: {
        createdAt: string;
        searchStartedAt: null | string;
        searchDeadlineAt: null | string;
        assignedAt: null | string;
        arrivedPickupAt: null | string;
        pickedUpAt: null | string;
        completedAt: null | string;
        cancelledAt: null | string;
      };
      cancellation: null | {
        by: null | "customer" | "partner" | "staff" | "system";
        reason: null | {
          id: string;
          label: string;
        };
        note: null | string;
        fee: number;
      };
      partner: null | {
        id: string;
        code: string;
        fullName: string;
        phone: string;
        photoUrl: null | string;
        rating: {
          average: null | number;
          count: number;
        };
      };
      vehicle: null | {
        id: string;
        type: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        model: null | string;
        plate: string;
        brand: null | string;
        color: null | string;
        seats: null | number;
      };
      partnerLocation: null | {
        lat: number;
        lng: number;
        heading: null | number;
        at: string;
      };
      customer: null | {
        id: string;
        code: string;
        phone: string;
        fullName: string;
      };
      proofs: Array<{
        fileId: string;
        kind: "delivery" | "pickup" | "cancel";
        stopId: null | string;
        url: null | string;
      }>;
      allowedActions: Array<"cancel" | "start_search" | "accept" | "search_timeout" | "retry" | "arrive" | "pick_up" | "complete" | "release">;
      rating: null | {
        createdAt: string;
        stars: number;
        tags: string[];
        comment: null | string;
      };
      canRate: boolean;
      cancelFreeUntil: null | string;
      cancelFeeIfNow?: number;
    };
  };
  'POST /v1/partner/orders/:id/pickup': {
    params: { id: string };
    body: {
      proofFileIds?: string[];
    };
    response: {
      id: string;
      code: string;
      status: "scheduled" | "searching" | "assigned" | "arrived_pickup" | "picked_up" | "completed" | "no_driver_found" | "cancelled";
      service: {
        id: string;
        kind: "delivery" | "ride" | "driver_hire" | "moving" | "charter" | "on_site";
        name: string;
        code: string;
        category: "delivery" | "transport" | "rental" | "bike" | "car" | "driver" | "intercity" | "handyman" | "labor";
        vehicleType: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
      };
      steps: {
        arrive: string;
        pickUp: string;
        complete: string;
        inProgress: string;
      };
      paymentMethod: "cash" | "wallet";
      scheduledAt: null | string;
      pickup: {
        lat: number;
        lng: number;
        address: string;
        contactName: null | string;
        contactPhone: null | string;
        note: null | string;
      };
      stops: Array<{
        id: string;
        seq: number;
        lat: number;
        lng: number;
        address: string;
        contactName: null | string;
        contactPhone: null | string;
        note: null | string;
        codAmount: number;
        status: "pending" | "failed" | "arrived" | "delivered" | "returned";
        arrivedAt: null | string;
        completedAt: null | string;
        failReason: null | string;
      }>;
      returnToPickup: boolean;
      durationMinutes: null | number;
      note: null | string;
      addons: Array<{
        id: string;
        name: string;
        price: number;
      }>;
      distanceMeters: number;
      durationSeconds: null | number;
      routePolyline: null | string;
      price: {
        lines: Array<{
          code: string;
          label: string;
          amount: number;
        }>;
        fare: number;
        discountable: number;
        discount: number;
        serviceTotal: number;
        platformFee: number;
        tip: number;
        total: number;
      };
      finalPrice: null | {
        lines: Array<{
          code: string;
          label: string;
          amount: number;
        }>;
        fare: number;
        discountable: number;
        discount: number;
        serviceTotal: number;
        platformFee: number;
        tip: number;
        total: number;
      };
      total: number;
      codTotal: number;
      codCollected: number;
      tip: number;
      debtAmount: number;
      cashToCollect: number;
      walletHeld: number;
      timeline: {
        createdAt: string;
        searchStartedAt: null | string;
        searchDeadlineAt: null | string;
        assignedAt: null | string;
        arrivedPickupAt: null | string;
        pickedUpAt: null | string;
        completedAt: null | string;
        cancelledAt: null | string;
      };
      cancellation: null | {
        by: null | "customer" | "partner" | "staff" | "system";
        reason: null | {
          id: string;
          label: string;
        };
        note: null | string;
        fee: number;
      };
      partner: null | {
        id: string;
        code: string;
        fullName: string;
        phone: string;
        photoUrl: null | string;
        rating: {
          average: null | number;
          count: number;
        };
      };
      vehicle: null | {
        id: string;
        type: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        model: null | string;
        plate: string;
        brand: null | string;
        color: null | string;
        seats: null | number;
      };
      partnerLocation: null | {
        lat: number;
        lng: number;
        heading: null | number;
        at: string;
      };
      customer: null | {
        id: string;
        code: string;
        phone: string;
        fullName: string;
      };
      proofs: Array<{
        fileId: string;
        kind: "delivery" | "pickup" | "cancel";
        stopId: null | string;
        url: null | string;
      }>;
      allowedActions: Array<"cancel" | "start_search" | "accept" | "search_timeout" | "retry" | "arrive" | "pick_up" | "complete" | "release">;
      rating: null | {
        createdAt: string;
        stars: number;
        tags: string[];
        comment: null | string;
      };
      canRate: boolean;
      cancelFreeUntil: null | string;
      cancelFeeIfNow?: number;
    };
  };
  /** Trả đơn (trước khi lấy hàng) — đơn tự tìm tài xế khác */
  'POST /v1/partner/orders/:id/release': {
    params: { id: string };
    body: {
      reasonId: string;
      note?: string;
      proofFileId?: string;
    };
    response: {
      ok: boolean;
    };
  };
  'POST /v1/partner/orders/:id/stops/:stopId/arrive': {
    params: { stopId: string; id: string };
    response: {
      id: string;
      code: string;
      status: "scheduled" | "searching" | "assigned" | "arrived_pickup" | "picked_up" | "completed" | "no_driver_found" | "cancelled";
      service: {
        id: string;
        kind: "delivery" | "ride" | "driver_hire" | "moving" | "charter" | "on_site";
        name: string;
        code: string;
        category: "delivery" | "transport" | "rental" | "bike" | "car" | "driver" | "intercity" | "handyman" | "labor";
        vehicleType: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
      };
      steps: {
        arrive: string;
        pickUp: string;
        complete: string;
        inProgress: string;
      };
      paymentMethod: "cash" | "wallet";
      scheduledAt: null | string;
      pickup: {
        lat: number;
        lng: number;
        address: string;
        contactName: null | string;
        contactPhone: null | string;
        note: null | string;
      };
      stops: Array<{
        id: string;
        seq: number;
        lat: number;
        lng: number;
        address: string;
        contactName: null | string;
        contactPhone: null | string;
        note: null | string;
        codAmount: number;
        status: "pending" | "failed" | "arrived" | "delivered" | "returned";
        arrivedAt: null | string;
        completedAt: null | string;
        failReason: null | string;
      }>;
      returnToPickup: boolean;
      durationMinutes: null | number;
      note: null | string;
      addons: Array<{
        id: string;
        name: string;
        price: number;
      }>;
      distanceMeters: number;
      durationSeconds: null | number;
      routePolyline: null | string;
      price: {
        lines: Array<{
          code: string;
          label: string;
          amount: number;
        }>;
        fare: number;
        discountable: number;
        discount: number;
        serviceTotal: number;
        platformFee: number;
        tip: number;
        total: number;
      };
      finalPrice: null | {
        lines: Array<{
          code: string;
          label: string;
          amount: number;
        }>;
        fare: number;
        discountable: number;
        discount: number;
        serviceTotal: number;
        platformFee: number;
        tip: number;
        total: number;
      };
      total: number;
      codTotal: number;
      codCollected: number;
      tip: number;
      debtAmount: number;
      cashToCollect: number;
      walletHeld: number;
      timeline: {
        createdAt: string;
        searchStartedAt: null | string;
        searchDeadlineAt: null | string;
        assignedAt: null | string;
        arrivedPickupAt: null | string;
        pickedUpAt: null | string;
        completedAt: null | string;
        cancelledAt: null | string;
      };
      cancellation: null | {
        by: null | "customer" | "partner" | "staff" | "system";
        reason: null | {
          id: string;
          label: string;
        };
        note: null | string;
        fee: number;
      };
      partner: null | {
        id: string;
        code: string;
        fullName: string;
        phone: string;
        photoUrl: null | string;
        rating: {
          average: null | number;
          count: number;
        };
      };
      vehicle: null | {
        id: string;
        type: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        model: null | string;
        plate: string;
        brand: null | string;
        color: null | string;
        seats: null | number;
      };
      partnerLocation: null | {
        lat: number;
        lng: number;
        heading: null | number;
        at: string;
      };
      customer: null | {
        id: string;
        code: string;
        phone: string;
        fullName: string;
      };
      proofs: Array<{
        fileId: string;
        kind: "delivery" | "pickup" | "cancel";
        stopId: null | string;
        url: null | string;
      }>;
      allowedActions: Array<"cancel" | "start_search" | "accept" | "search_timeout" | "retry" | "arrive" | "pick_up" | "complete" | "release">;
      rating: null | {
        createdAt: string;
        stars: number;
        tags: string[];
        comment: null | string;
      };
      canRate: boolean;
      cancelFreeUntil: null | string;
      cancelFeeIfNow?: number;
    };
  };
  'POST /v1/partner/orders/:id/stops/:stopId/complete': {
    params: { stopId: string; id: string };
    body: {
      status: "failed" | "delivered" | "returned";
      reason?: string;
      proofFileIds?: string[];
    };
    response: {
      id: string;
      code: string;
      status: "scheduled" | "searching" | "assigned" | "arrived_pickup" | "picked_up" | "completed" | "no_driver_found" | "cancelled";
      service: {
        id: string;
        kind: "delivery" | "ride" | "driver_hire" | "moving" | "charter" | "on_site";
        name: string;
        code: string;
        category: "delivery" | "transport" | "rental" | "bike" | "car" | "driver" | "intercity" | "handyman" | "labor";
        vehicleType: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
      };
      steps: {
        arrive: string;
        pickUp: string;
        complete: string;
        inProgress: string;
      };
      paymentMethod: "cash" | "wallet";
      scheduledAt: null | string;
      pickup: {
        lat: number;
        lng: number;
        address: string;
        contactName: null | string;
        contactPhone: null | string;
        note: null | string;
      };
      stops: Array<{
        id: string;
        seq: number;
        lat: number;
        lng: number;
        address: string;
        contactName: null | string;
        contactPhone: null | string;
        note: null | string;
        codAmount: number;
        status: "pending" | "failed" | "arrived" | "delivered" | "returned";
        arrivedAt: null | string;
        completedAt: null | string;
        failReason: null | string;
      }>;
      returnToPickup: boolean;
      durationMinutes: null | number;
      note: null | string;
      addons: Array<{
        id: string;
        name: string;
        price: number;
      }>;
      distanceMeters: number;
      durationSeconds: null | number;
      routePolyline: null | string;
      price: {
        lines: Array<{
          code: string;
          label: string;
          amount: number;
        }>;
        fare: number;
        discountable: number;
        discount: number;
        serviceTotal: number;
        platformFee: number;
        tip: number;
        total: number;
      };
      finalPrice: null | {
        lines: Array<{
          code: string;
          label: string;
          amount: number;
        }>;
        fare: number;
        discountable: number;
        discount: number;
        serviceTotal: number;
        platformFee: number;
        tip: number;
        total: number;
      };
      total: number;
      codTotal: number;
      codCollected: number;
      tip: number;
      debtAmount: number;
      cashToCollect: number;
      walletHeld: number;
      timeline: {
        createdAt: string;
        searchStartedAt: null | string;
        searchDeadlineAt: null | string;
        assignedAt: null | string;
        arrivedPickupAt: null | string;
        pickedUpAt: null | string;
        completedAt: null | string;
        cancelledAt: null | string;
      };
      cancellation: null | {
        by: null | "customer" | "partner" | "staff" | "system";
        reason: null | {
          id: string;
          label: string;
        };
        note: null | string;
        fee: number;
      };
      partner: null | {
        id: string;
        code: string;
        fullName: string;
        phone: string;
        photoUrl: null | string;
        rating: {
          average: null | number;
          count: number;
        };
      };
      vehicle: null | {
        id: string;
        type: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        model: null | string;
        plate: string;
        brand: null | string;
        color: null | string;
        seats: null | number;
      };
      partnerLocation: null | {
        lat: number;
        lng: number;
        heading: null | number;
        at: string;
      };
      customer: null | {
        id: string;
        code: string;
        phone: string;
        fullName: string;
      };
      proofs: Array<{
        fileId: string;
        kind: "delivery" | "pickup" | "cancel";
        stopId: null | string;
        url: null | string;
      }>;
      allowedActions: Array<"cancel" | "start_search" | "accept" | "search_timeout" | "retry" | "arrive" | "pick_up" | "complete" | "release">;
      rating: null | {
        createdAt: string;
        stars: number;
        tags: string[];
        comment: null | string;
      };
      canRate: boolean;
      cancelFreeUntil: null | string;
      cancelFeeIfNow?: number;
    };
  };
  'GET /v1/partner/orders/current': {
    response: null | ({
      id: string;
      code: string;
      status: "scheduled" | "searching" | "assigned" | "arrived_pickup" | "picked_up" | "completed" | "no_driver_found" | "cancelled";
      service: {
        id: string;
        kind: "delivery" | "ride" | "driver_hire" | "moving" | "charter" | "on_site";
        name: string;
        code: string;
        category: "delivery" | "transport" | "rental" | "bike" | "car" | "driver" | "intercity" | "handyman" | "labor";
        vehicleType: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
      };
      steps: {
        arrive: string;
        pickUp: string;
        complete: string;
        inProgress: string;
      };
      paymentMethod: "cash" | "wallet";
      scheduledAt: null | string;
      pickup: {
        lat: number;
        lng: number;
        address: string;
        contactName: null | string;
        contactPhone: null | string;
        note: null | string;
      };
      stops: Array<{
        id: string;
        seq: number;
        lat: number;
        lng: number;
        address: string;
        contactName: null | string;
        contactPhone: null | string;
        note: null | string;
        codAmount: number;
        status: "pending" | "failed" | "arrived" | "delivered" | "returned";
        arrivedAt: null | string;
        completedAt: null | string;
        failReason: null | string;
      }>;
      returnToPickup: boolean;
      durationMinutes: null | number;
      note: null | string;
      addons: Array<{
        id: string;
        name: string;
        price: number;
      }>;
      distanceMeters: number;
      durationSeconds: null | number;
      routePolyline: null | string;
      price: {
        lines: Array<{
          code: string;
          label: string;
          amount: number;
        }>;
        fare: number;
        discountable: number;
        discount: number;
        serviceTotal: number;
        platformFee: number;
        tip: number;
        total: number;
      };
      finalPrice: null | {
        lines: Array<{
          code: string;
          label: string;
          amount: number;
        }>;
        fare: number;
        discountable: number;
        discount: number;
        serviceTotal: number;
        platformFee: number;
        tip: number;
        total: number;
      };
      total: number;
      codTotal: number;
      codCollected: number;
      tip: number;
      debtAmount: number;
      cashToCollect: number;
      walletHeld: number;
      timeline: {
        createdAt: string;
        searchStartedAt: null | string;
        searchDeadlineAt: null | string;
        assignedAt: null | string;
        arrivedPickupAt: null | string;
        pickedUpAt: null | string;
        completedAt: null | string;
        cancelledAt: null | string;
      };
      cancellation: null | {
        by: null | "customer" | "partner" | "staff" | "system";
        reason: null | {
          id: string;
          label: string;
        };
        note: null | string;
        fee: number;
      };
      partner: null | {
        id: string;
        code: string;
        fullName: string;
        phone: string;
        photoUrl: null | string;
        rating: {
          average: null | number;
          count: number;
        };
      };
      vehicle: null | {
        id: string;
        type: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        model: null | string;
        plate: string;
        brand: null | string;
        color: null | string;
        seats: null | number;
      };
      partnerLocation: null | {
        lat: number;
        lng: number;
        heading: null | number;
        at: string;
      };
      customer: null | {
        id: string;
        code: string;
        phone: string;
        fullName: string;
      };
      proofs: Array<{
        fileId: string;
        kind: "delivery" | "pickup" | "cancel";
        stopId: null | string;
        url: null | string;
      }>;
      allowedActions: Array<"cancel" | "start_search" | "accept" | "search_timeout" | "retry" | "arrive" | "pick_up" | "complete" | "release">;
      rating: null | {
        createdAt: string;
        stars: number;
        tags: string[];
        comment: null | string;
      };
      canRate: boolean;
      cancelFreeUntil: null | string;
      cancelFeeIfNow?: number;
    });
  };
  'GET /v1/partner/profile': {
    response: {
      status: "active" | "suspended" | "deleted" | "pending_profile" | "pending_review" | "changes_requested" | "rejected";
      profile: null | {
        kind: "individual" | "moving_team" | "bus_company";
        gender: null | "other" | "male" | "female";
        dateOfBirth: null | string;
        city: null | string;
        address: null | string;
        organizationName: null | string;
        taxCode: null | string;
        teamSize: null | number;
        fleetSize: null | number;
        serviceArea: null | string;
        note: null | string;
        languages: string[];
        acceptCod: boolean;
        autoAccept: boolean;
        submittedAt: null | string;
        firstApprovedAt: null | string;
      };
      editable: boolean;
      canChangeKind: boolean;
      canSubmit: boolean;
      blockers: string[];
      requirements: Array<{
        key: string;
        kind: "vehicle" | "document";
        documentType: null | "other" | "id_card" | "portrait" | "driver_license" | "judicial_record" | "professional_certificate" | "business_license" | "vehicle_registration" | "vehicle_insurance" | "vehicle_inspection" | "vehicle_photos";
        vehicleId: null | string;
        label: string;
        reason: string;
        required: boolean;
        state: "rejected" | "expired" | "pending" | "approved" | "missing" | "insufficient";
        message: null | string;
      }>;
      eligibility: Array<{
        serviceId: string;
        eligible: boolean;
        vehicleIds: string[];
        problems: string[];
      }>;
      documents: Array<{
        id: string;
        type: "other" | "id_card" | "portrait" | "driver_license" | "judicial_record" | "professional_certificate" | "business_license" | "vehicle_registration" | "vehicle_insurance" | "vehicle_inspection" | "vehicle_photos";
        vehicleId: null | string;
        number: null | string;
        licenseClasses: string[];
        issuedOn: null | string;
        issuedPlace: null | string;
        expiresOn: null | string;
        note: null | string;
        status: "rejected" | "pending" | "approved" | "superseded" | "removed";
        reviewNote: null | string;
        reviewedAt: null | string;
        createdAt: string;
        version: string;
        files: Array<{
          slot: string;
          fileId: string;
          contentType: string;
          size: number;
          url: null | string;
        }>;
      }>;
      vehicles: Array<{
        id: string;
        type: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        plate: string;
        brand: null | string;
        model: null | string;
        color: null | string;
        year: null | number;
        seats: null | number;
        loadKg: null | number;
        ownerName: null | string;
        status: "rejected" | "pending" | "approved" | "superseded" | "removed";
        reviewNote: null | string;
        reviewedAt: null | string;
        createdAt: string;
        version: string;
      }>;
      services: Array<{
        serviceId: string;
        code: string;
        name: string;
        category: "delivery" | "transport" | "rental" | "bike" | "car" | "driver" | "intercity" | "handyman" | "labor";
        kind: "delivery" | "ride" | "driver_hire" | "moving" | "charter" | "on_site";
        vehicleType: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        vehicleSeats: null | number;
        vehicleLoadKg: null | number;
        serviceStatus: "active" | "draft" | "paused" | "archived";
        status: "rejected" | "pending" | "approved" | "superseded" | "removed";
        enabled: boolean;
        reviewNote: null | string;
        reviewedAt: null | string;
        version: string;
      }>;
      lastReview: null | {
        event: "changes_requested" | "rejected" | "approved" | "submitted" | "withdrawn" | "reopened" | "items_reviewed";
        note: null | string;
        at: string;
      };
      availability: {
        online: boolean;
        activeVehicleId: null | string;
      };
    };
  };
  'PATCH /v1/partner/profile': {
    body: {
      kind?: "individual" | "moving_team" | "bus_company";
      gender?: null | "other" | "male" | "female";
      dateOfBirth?: null | string;
      city?: null | string;
      address?: null | string;
      organizationName?: null | string;
      taxCode?: null | string;
      teamSize?: null | number;
      fleetSize?: null | number;
      serviceArea?: null | string;
      note?: null | string;
      languages?: Array<"vi" | "en" | "ja" | "zh" | "ko">;
      acceptCod?: boolean;
      autoAccept?: boolean;
    };
    response: {
      status: "active" | "suspended" | "deleted" | "pending_profile" | "pending_review" | "changes_requested" | "rejected";
      profile: null | {
        kind: "individual" | "moving_team" | "bus_company";
        gender: null | "other" | "male" | "female";
        dateOfBirth: null | string;
        city: null | string;
        address: null | string;
        organizationName: null | string;
        taxCode: null | string;
        teamSize: null | number;
        fleetSize: null | number;
        serviceArea: null | string;
        note: null | string;
        languages: string[];
        acceptCod: boolean;
        autoAccept: boolean;
        submittedAt: null | string;
        firstApprovedAt: null | string;
      };
      editable: boolean;
      canChangeKind: boolean;
      canSubmit: boolean;
      blockers: string[];
      requirements: Array<{
        key: string;
        kind: "vehicle" | "document";
        documentType: null | "other" | "id_card" | "portrait" | "driver_license" | "judicial_record" | "professional_certificate" | "business_license" | "vehicle_registration" | "vehicle_insurance" | "vehicle_inspection" | "vehicle_photos";
        vehicleId: null | string;
        label: string;
        reason: string;
        required: boolean;
        state: "rejected" | "expired" | "pending" | "approved" | "missing" | "insufficient";
        message: null | string;
      }>;
      eligibility: Array<{
        serviceId: string;
        eligible: boolean;
        vehicleIds: string[];
        problems: string[];
      }>;
      documents: Array<{
        id: string;
        type: "other" | "id_card" | "portrait" | "driver_license" | "judicial_record" | "professional_certificate" | "business_license" | "vehicle_registration" | "vehicle_insurance" | "vehicle_inspection" | "vehicle_photos";
        vehicleId: null | string;
        number: null | string;
        licenseClasses: string[];
        issuedOn: null | string;
        issuedPlace: null | string;
        expiresOn: null | string;
        note: null | string;
        status: "rejected" | "pending" | "approved" | "superseded" | "removed";
        reviewNote: null | string;
        reviewedAt: null | string;
        createdAt: string;
        version: string;
        files: Array<{
          slot: string;
          fileId: string;
          contentType: string;
          size: number;
          url: null | string;
        }>;
      }>;
      vehicles: Array<{
        id: string;
        type: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        plate: string;
        brand: null | string;
        model: null | string;
        color: null | string;
        year: null | number;
        seats: null | number;
        loadKg: null | number;
        ownerName: null | string;
        status: "rejected" | "pending" | "approved" | "superseded" | "removed";
        reviewNote: null | string;
        reviewedAt: null | string;
        createdAt: string;
        version: string;
      }>;
      services: Array<{
        serviceId: string;
        code: string;
        name: string;
        category: "delivery" | "transport" | "rental" | "bike" | "car" | "driver" | "intercity" | "handyman" | "labor";
        kind: "delivery" | "ride" | "driver_hire" | "moving" | "charter" | "on_site";
        vehicleType: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        vehicleSeats: null | number;
        vehicleLoadKg: null | number;
        serviceStatus: "active" | "draft" | "paused" | "archived";
        status: "rejected" | "pending" | "approved" | "superseded" | "removed";
        enabled: boolean;
        reviewNote: null | string;
        reviewedAt: null | string;
        version: string;
      }>;
      lastReview: null | {
        event: "changes_requested" | "rejected" | "approved" | "submitted" | "withdrawn" | "reopened" | "items_reviewed";
        note: null | string;
        at: string;
      };
      availability: {
        online: boolean;
        activeVehicleId: null | string;
      };
    };
  };
  'POST /v1/partner/profile/submit': {
    response: {
      status: "active" | "suspended" | "deleted" | "pending_profile" | "pending_review" | "changes_requested" | "rejected";
      profile: null | {
        kind: "individual" | "moving_team" | "bus_company";
        gender: null | "other" | "male" | "female";
        dateOfBirth: null | string;
        city: null | string;
        address: null | string;
        organizationName: null | string;
        taxCode: null | string;
        teamSize: null | number;
        fleetSize: null | number;
        serviceArea: null | string;
        note: null | string;
        languages: string[];
        acceptCod: boolean;
        autoAccept: boolean;
        submittedAt: null | string;
        firstApprovedAt: null | string;
      };
      editable: boolean;
      canChangeKind: boolean;
      canSubmit: boolean;
      blockers: string[];
      requirements: Array<{
        key: string;
        kind: "vehicle" | "document";
        documentType: null | "other" | "id_card" | "portrait" | "driver_license" | "judicial_record" | "professional_certificate" | "business_license" | "vehicle_registration" | "vehicle_insurance" | "vehicle_inspection" | "vehicle_photos";
        vehicleId: null | string;
        label: string;
        reason: string;
        required: boolean;
        state: "rejected" | "expired" | "pending" | "approved" | "missing" | "insufficient";
        message: null | string;
      }>;
      eligibility: Array<{
        serviceId: string;
        eligible: boolean;
        vehicleIds: string[];
        problems: string[];
      }>;
      documents: Array<{
        id: string;
        type: "other" | "id_card" | "portrait" | "driver_license" | "judicial_record" | "professional_certificate" | "business_license" | "vehicle_registration" | "vehicle_insurance" | "vehicle_inspection" | "vehicle_photos";
        vehicleId: null | string;
        number: null | string;
        licenseClasses: string[];
        issuedOn: null | string;
        issuedPlace: null | string;
        expiresOn: null | string;
        note: null | string;
        status: "rejected" | "pending" | "approved" | "superseded" | "removed";
        reviewNote: null | string;
        reviewedAt: null | string;
        createdAt: string;
        version: string;
        files: Array<{
          slot: string;
          fileId: string;
          contentType: string;
          size: number;
          url: null | string;
        }>;
      }>;
      vehicles: Array<{
        id: string;
        type: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        plate: string;
        brand: null | string;
        model: null | string;
        color: null | string;
        year: null | number;
        seats: null | number;
        loadKg: null | number;
        ownerName: null | string;
        status: "rejected" | "pending" | "approved" | "superseded" | "removed";
        reviewNote: null | string;
        reviewedAt: null | string;
        createdAt: string;
        version: string;
      }>;
      services: Array<{
        serviceId: string;
        code: string;
        name: string;
        category: "delivery" | "transport" | "rental" | "bike" | "car" | "driver" | "intercity" | "handyman" | "labor";
        kind: "delivery" | "ride" | "driver_hire" | "moving" | "charter" | "on_site";
        vehicleType: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        vehicleSeats: null | number;
        vehicleLoadKg: null | number;
        serviceStatus: "active" | "draft" | "paused" | "archived";
        status: "rejected" | "pending" | "approved" | "superseded" | "removed";
        enabled: boolean;
        reviewNote: null | string;
        reviewedAt: null | string;
        version: string;
      }>;
      lastReview: null | {
        event: "changes_requested" | "rejected" | "approved" | "submitted" | "withdrawn" | "reopened" | "items_reviewed";
        note: null | string;
        at: string;
      };
      availability: {
        online: boolean;
        activeVehicleId: null | string;
      };
    };
  };
  'POST /v1/partner/profile/withdraw': {
    response: {
      status: "active" | "suspended" | "deleted" | "pending_profile" | "pending_review" | "changes_requested" | "rejected";
      profile: null | {
        kind: "individual" | "moving_team" | "bus_company";
        gender: null | "other" | "male" | "female";
        dateOfBirth: null | string;
        city: null | string;
        address: null | string;
        organizationName: null | string;
        taxCode: null | string;
        teamSize: null | number;
        fleetSize: null | number;
        serviceArea: null | string;
        note: null | string;
        languages: string[];
        acceptCod: boolean;
        autoAccept: boolean;
        submittedAt: null | string;
        firstApprovedAt: null | string;
      };
      editable: boolean;
      canChangeKind: boolean;
      canSubmit: boolean;
      blockers: string[];
      requirements: Array<{
        key: string;
        kind: "vehicle" | "document";
        documentType: null | "other" | "id_card" | "portrait" | "driver_license" | "judicial_record" | "professional_certificate" | "business_license" | "vehicle_registration" | "vehicle_insurance" | "vehicle_inspection" | "vehicle_photos";
        vehicleId: null | string;
        label: string;
        reason: string;
        required: boolean;
        state: "rejected" | "expired" | "pending" | "approved" | "missing" | "insufficient";
        message: null | string;
      }>;
      eligibility: Array<{
        serviceId: string;
        eligible: boolean;
        vehicleIds: string[];
        problems: string[];
      }>;
      documents: Array<{
        id: string;
        type: "other" | "id_card" | "portrait" | "driver_license" | "judicial_record" | "professional_certificate" | "business_license" | "vehicle_registration" | "vehicle_insurance" | "vehicle_inspection" | "vehicle_photos";
        vehicleId: null | string;
        number: null | string;
        licenseClasses: string[];
        issuedOn: null | string;
        issuedPlace: null | string;
        expiresOn: null | string;
        note: null | string;
        status: "rejected" | "pending" | "approved" | "superseded" | "removed";
        reviewNote: null | string;
        reviewedAt: null | string;
        createdAt: string;
        version: string;
        files: Array<{
          slot: string;
          fileId: string;
          contentType: string;
          size: number;
          url: null | string;
        }>;
      }>;
      vehicles: Array<{
        id: string;
        type: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        plate: string;
        brand: null | string;
        model: null | string;
        color: null | string;
        year: null | number;
        seats: null | number;
        loadKg: null | number;
        ownerName: null | string;
        status: "rejected" | "pending" | "approved" | "superseded" | "removed";
        reviewNote: null | string;
        reviewedAt: null | string;
        createdAt: string;
        version: string;
      }>;
      services: Array<{
        serviceId: string;
        code: string;
        name: string;
        category: "delivery" | "transport" | "rental" | "bike" | "car" | "driver" | "intercity" | "handyman" | "labor";
        kind: "delivery" | "ride" | "driver_hire" | "moving" | "charter" | "on_site";
        vehicleType: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        vehicleSeats: null | number;
        vehicleLoadKg: null | number;
        serviceStatus: "active" | "draft" | "paused" | "archived";
        status: "rejected" | "pending" | "approved" | "superseded" | "removed";
        enabled: boolean;
        reviewNote: null | string;
        reviewedAt: null | string;
        version: string;
      }>;
      lastReview: null | {
        event: "changes_requested" | "rejected" | "approved" | "submitted" | "withdrawn" | "reopened" | "items_reviewed";
        note: null | string;
        at: string;
      };
      availability: {
        online: boolean;
        activeVehicleId: null | string;
      };
    };
  };
  /** Điểm đánh giá trung bình + các đánh giá gần đây của khách */
  'GET /v1/partner/ratings': {
    query?: {
      page?: number;
      pageSize?: number;
    };
    response: {
      items: Array<{
        orderCode: string;
        service: string;
        stars: number;
        tags: string[];
        comment: null | string;
        createdAt: string;
      }>;
      page: number;
      pageSize: number;
      total: number;
      summary: {
        average: null | number;
        count: number;
      };
    };
  };
  /** Dịch vụ đăng ký được theo loại đối tác, kèm yêu cầu xe / hạng bằng */
  'GET /v1/partner/service-options': {
    response: Array<{
      needsOwnVehicle: boolean;
      needsLicense: boolean;
      vehicleNeed: null | string;
      licenseClasses: Array<"A1" | "A" | "A2" | "B1" | "B" | "B2" | "C1" | "C" | "D1" | "D2" | "D" | "E" | "BE" | "C1E" | "CE" | "D1E" | "D2E" | "DE">;
      id: string;
      kind: "delivery" | "ride" | "driver_hire" | "moving" | "charter" | "on_site";
      name: string;
      code: string;
      status: "active" | "draft" | "paused" | "archived";
      category: "delivery" | "transport" | "rental" | "bike" | "car" | "driver" | "intercity" | "handyman" | "labor";
      vehicleType: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
      vehicleSeats: null | number;
      vehicleLoadKg: null | number;
    }>;
  };
  'PUT /v1/partner/services': {
    body: {
      serviceIds: string[];
    };
    response: {
      status: "active" | "suspended" | "deleted" | "pending_profile" | "pending_review" | "changes_requested" | "rejected";
      profile: null | {
        kind: "individual" | "moving_team" | "bus_company";
        gender: null | "other" | "male" | "female";
        dateOfBirth: null | string;
        city: null | string;
        address: null | string;
        organizationName: null | string;
        taxCode: null | string;
        teamSize: null | number;
        fleetSize: null | number;
        serviceArea: null | string;
        note: null | string;
        languages: string[];
        acceptCod: boolean;
        autoAccept: boolean;
        submittedAt: null | string;
        firstApprovedAt: null | string;
      };
      editable: boolean;
      canChangeKind: boolean;
      canSubmit: boolean;
      blockers: string[];
      requirements: Array<{
        key: string;
        kind: "vehicle" | "document";
        documentType: null | "other" | "id_card" | "portrait" | "driver_license" | "judicial_record" | "professional_certificate" | "business_license" | "vehicle_registration" | "vehicle_insurance" | "vehicle_inspection" | "vehicle_photos";
        vehicleId: null | string;
        label: string;
        reason: string;
        required: boolean;
        state: "rejected" | "expired" | "pending" | "approved" | "missing" | "insufficient";
        message: null | string;
      }>;
      eligibility: Array<{
        serviceId: string;
        eligible: boolean;
        vehicleIds: string[];
        problems: string[];
      }>;
      documents: Array<{
        id: string;
        type: "other" | "id_card" | "portrait" | "driver_license" | "judicial_record" | "professional_certificate" | "business_license" | "vehicle_registration" | "vehicle_insurance" | "vehicle_inspection" | "vehicle_photos";
        vehicleId: null | string;
        number: null | string;
        licenseClasses: string[];
        issuedOn: null | string;
        issuedPlace: null | string;
        expiresOn: null | string;
        note: null | string;
        status: "rejected" | "pending" | "approved" | "superseded" | "removed";
        reviewNote: null | string;
        reviewedAt: null | string;
        createdAt: string;
        version: string;
        files: Array<{
          slot: string;
          fileId: string;
          contentType: string;
          size: number;
          url: null | string;
        }>;
      }>;
      vehicles: Array<{
        id: string;
        type: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        plate: string;
        brand: null | string;
        model: null | string;
        color: null | string;
        year: null | number;
        seats: null | number;
        loadKg: null | number;
        ownerName: null | string;
        status: "rejected" | "pending" | "approved" | "superseded" | "removed";
        reviewNote: null | string;
        reviewedAt: null | string;
        createdAt: string;
        version: string;
      }>;
      services: Array<{
        serviceId: string;
        code: string;
        name: string;
        category: "delivery" | "transport" | "rental" | "bike" | "car" | "driver" | "intercity" | "handyman" | "labor";
        kind: "delivery" | "ride" | "driver_hire" | "moving" | "charter" | "on_site";
        vehicleType: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        vehicleSeats: null | number;
        vehicleLoadKg: null | number;
        serviceStatus: "active" | "draft" | "paused" | "archived";
        status: "rejected" | "pending" | "approved" | "superseded" | "removed";
        enabled: boolean;
        reviewNote: null | string;
        reviewedAt: null | string;
        version: string;
      }>;
      lastReview: null | {
        event: "changes_requested" | "rejected" | "approved" | "submitted" | "withdrawn" | "reopened" | "items_reviewed";
        note: null | string;
        at: string;
      };
      availability: {
        online: boolean;
        activeVehicleId: null | string;
      };
    };
  };
  'POST /v1/partner/vehicles': {
    body: {
      plate: string;
      type: "car" | "motorbike" | "van" | "truck" | "bus";
      brand?: null | string;
      model?: null | string;
      color?: null | string;
      year?: null | number;
      seats?: null | number;
      loadKg?: null | number;
      ownerName?: null | string;
    };
    response: {
      status: "active" | "suspended" | "deleted" | "pending_profile" | "pending_review" | "changes_requested" | "rejected";
      profile: null | {
        kind: "individual" | "moving_team" | "bus_company";
        gender: null | "other" | "male" | "female";
        dateOfBirth: null | string;
        city: null | string;
        address: null | string;
        organizationName: null | string;
        taxCode: null | string;
        teamSize: null | number;
        fleetSize: null | number;
        serviceArea: null | string;
        note: null | string;
        languages: string[];
        acceptCod: boolean;
        autoAccept: boolean;
        submittedAt: null | string;
        firstApprovedAt: null | string;
      };
      editable: boolean;
      canChangeKind: boolean;
      canSubmit: boolean;
      blockers: string[];
      requirements: Array<{
        key: string;
        kind: "vehicle" | "document";
        documentType: null | "other" | "id_card" | "portrait" | "driver_license" | "judicial_record" | "professional_certificate" | "business_license" | "vehicle_registration" | "vehicle_insurance" | "vehicle_inspection" | "vehicle_photos";
        vehicleId: null | string;
        label: string;
        reason: string;
        required: boolean;
        state: "rejected" | "expired" | "pending" | "approved" | "missing" | "insufficient";
        message: null | string;
      }>;
      eligibility: Array<{
        serviceId: string;
        eligible: boolean;
        vehicleIds: string[];
        problems: string[];
      }>;
      documents: Array<{
        id: string;
        type: "other" | "id_card" | "portrait" | "driver_license" | "judicial_record" | "professional_certificate" | "business_license" | "vehicle_registration" | "vehicle_insurance" | "vehicle_inspection" | "vehicle_photos";
        vehicleId: null | string;
        number: null | string;
        licenseClasses: string[];
        issuedOn: null | string;
        issuedPlace: null | string;
        expiresOn: null | string;
        note: null | string;
        status: "rejected" | "pending" | "approved" | "superseded" | "removed";
        reviewNote: null | string;
        reviewedAt: null | string;
        createdAt: string;
        version: string;
        files: Array<{
          slot: string;
          fileId: string;
          contentType: string;
          size: number;
          url: null | string;
        }>;
      }>;
      vehicles: Array<{
        id: string;
        type: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        plate: string;
        brand: null | string;
        model: null | string;
        color: null | string;
        year: null | number;
        seats: null | number;
        loadKg: null | number;
        ownerName: null | string;
        status: "rejected" | "pending" | "approved" | "superseded" | "removed";
        reviewNote: null | string;
        reviewedAt: null | string;
        createdAt: string;
        version: string;
      }>;
      services: Array<{
        serviceId: string;
        code: string;
        name: string;
        category: "delivery" | "transport" | "rental" | "bike" | "car" | "driver" | "intercity" | "handyman" | "labor";
        kind: "delivery" | "ride" | "driver_hire" | "moving" | "charter" | "on_site";
        vehicleType: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        vehicleSeats: null | number;
        vehicleLoadKg: null | number;
        serviceStatus: "active" | "draft" | "paused" | "archived";
        status: "rejected" | "pending" | "approved" | "superseded" | "removed";
        enabled: boolean;
        reviewNote: null | string;
        reviewedAt: null | string;
        version: string;
      }>;
      lastReview: null | {
        event: "changes_requested" | "rejected" | "approved" | "submitted" | "withdrawn" | "reopened" | "items_reviewed";
        note: null | string;
        at: string;
      };
      availability: {
        online: boolean;
        activeVehicleId: null | string;
      };
    };
  };
  'DELETE /v1/partner/vehicles/:id': {
    params: { id: string };
    response: {
      status: "active" | "suspended" | "deleted" | "pending_profile" | "pending_review" | "changes_requested" | "rejected";
      profile: null | {
        kind: "individual" | "moving_team" | "bus_company";
        gender: null | "other" | "male" | "female";
        dateOfBirth: null | string;
        city: null | string;
        address: null | string;
        organizationName: null | string;
        taxCode: null | string;
        teamSize: null | number;
        fleetSize: null | number;
        serviceArea: null | string;
        note: null | string;
        languages: string[];
        acceptCod: boolean;
        autoAccept: boolean;
        submittedAt: null | string;
        firstApprovedAt: null | string;
      };
      editable: boolean;
      canChangeKind: boolean;
      canSubmit: boolean;
      blockers: string[];
      requirements: Array<{
        key: string;
        kind: "vehicle" | "document";
        documentType: null | "other" | "id_card" | "portrait" | "driver_license" | "judicial_record" | "professional_certificate" | "business_license" | "vehicle_registration" | "vehicle_insurance" | "vehicle_inspection" | "vehicle_photos";
        vehicleId: null | string;
        label: string;
        reason: string;
        required: boolean;
        state: "rejected" | "expired" | "pending" | "approved" | "missing" | "insufficient";
        message: null | string;
      }>;
      eligibility: Array<{
        serviceId: string;
        eligible: boolean;
        vehicleIds: string[];
        problems: string[];
      }>;
      documents: Array<{
        id: string;
        type: "other" | "id_card" | "portrait" | "driver_license" | "judicial_record" | "professional_certificate" | "business_license" | "vehicle_registration" | "vehicle_insurance" | "vehicle_inspection" | "vehicle_photos";
        vehicleId: null | string;
        number: null | string;
        licenseClasses: string[];
        issuedOn: null | string;
        issuedPlace: null | string;
        expiresOn: null | string;
        note: null | string;
        status: "rejected" | "pending" | "approved" | "superseded" | "removed";
        reviewNote: null | string;
        reviewedAt: null | string;
        createdAt: string;
        version: string;
        files: Array<{
          slot: string;
          fileId: string;
          contentType: string;
          size: number;
          url: null | string;
        }>;
      }>;
      vehicles: Array<{
        id: string;
        type: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        plate: string;
        brand: null | string;
        model: null | string;
        color: null | string;
        year: null | number;
        seats: null | number;
        loadKg: null | number;
        ownerName: null | string;
        status: "rejected" | "pending" | "approved" | "superseded" | "removed";
        reviewNote: null | string;
        reviewedAt: null | string;
        createdAt: string;
        version: string;
      }>;
      services: Array<{
        serviceId: string;
        code: string;
        name: string;
        category: "delivery" | "transport" | "rental" | "bike" | "car" | "driver" | "intercity" | "handyman" | "labor";
        kind: "delivery" | "ride" | "driver_hire" | "moving" | "charter" | "on_site";
        vehicleType: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        vehicleSeats: null | number;
        vehicleLoadKg: null | number;
        serviceStatus: "active" | "draft" | "paused" | "archived";
        status: "rejected" | "pending" | "approved" | "superseded" | "removed";
        enabled: boolean;
        reviewNote: null | string;
        reviewedAt: null | string;
        version: string;
      }>;
      lastReview: null | {
        event: "changes_requested" | "rejected" | "approved" | "submitted" | "withdrawn" | "reopened" | "items_reviewed";
        note: null | string;
        at: string;
      };
      availability: {
        online: boolean;
        activeVehicleId: null | string;
      };
    };
  };
  'PATCH /v1/partner/vehicles/:id': {
    params: { id: string };
    body: {
      plate?: string;
      brand?: null | string;
      model?: null | string;
      color?: null | string;
      year?: null | number;
      seats?: null | number;
      loadKg?: null | number;
      ownerName?: null | string;
    };
    response: {
      status: "active" | "suspended" | "deleted" | "pending_profile" | "pending_review" | "changes_requested" | "rejected";
      profile: null | {
        kind: "individual" | "moving_team" | "bus_company";
        gender: null | "other" | "male" | "female";
        dateOfBirth: null | string;
        city: null | string;
        address: null | string;
        organizationName: null | string;
        taxCode: null | string;
        teamSize: null | number;
        fleetSize: null | number;
        serviceArea: null | string;
        note: null | string;
        languages: string[];
        acceptCod: boolean;
        autoAccept: boolean;
        submittedAt: null | string;
        firstApprovedAt: null | string;
      };
      editable: boolean;
      canChangeKind: boolean;
      canSubmit: boolean;
      blockers: string[];
      requirements: Array<{
        key: string;
        kind: "vehicle" | "document";
        documentType: null | "other" | "id_card" | "portrait" | "driver_license" | "judicial_record" | "professional_certificate" | "business_license" | "vehicle_registration" | "vehicle_insurance" | "vehicle_inspection" | "vehicle_photos";
        vehicleId: null | string;
        label: string;
        reason: string;
        required: boolean;
        state: "rejected" | "expired" | "pending" | "approved" | "missing" | "insufficient";
        message: null | string;
      }>;
      eligibility: Array<{
        serviceId: string;
        eligible: boolean;
        vehicleIds: string[];
        problems: string[];
      }>;
      documents: Array<{
        id: string;
        type: "other" | "id_card" | "portrait" | "driver_license" | "judicial_record" | "professional_certificate" | "business_license" | "vehicle_registration" | "vehicle_insurance" | "vehicle_inspection" | "vehicle_photos";
        vehicleId: null | string;
        number: null | string;
        licenseClasses: string[];
        issuedOn: null | string;
        issuedPlace: null | string;
        expiresOn: null | string;
        note: null | string;
        status: "rejected" | "pending" | "approved" | "superseded" | "removed";
        reviewNote: null | string;
        reviewedAt: null | string;
        createdAt: string;
        version: string;
        files: Array<{
          slot: string;
          fileId: string;
          contentType: string;
          size: number;
          url: null | string;
        }>;
      }>;
      vehicles: Array<{
        id: string;
        type: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        plate: string;
        brand: null | string;
        model: null | string;
        color: null | string;
        year: null | number;
        seats: null | number;
        loadKg: null | number;
        ownerName: null | string;
        status: "rejected" | "pending" | "approved" | "superseded" | "removed";
        reviewNote: null | string;
        reviewedAt: null | string;
        createdAt: string;
        version: string;
      }>;
      services: Array<{
        serviceId: string;
        code: string;
        name: string;
        category: "delivery" | "transport" | "rental" | "bike" | "car" | "driver" | "intercity" | "handyman" | "labor";
        kind: "delivery" | "ride" | "driver_hire" | "moving" | "charter" | "on_site";
        vehicleType: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        vehicleSeats: null | number;
        vehicleLoadKg: null | number;
        serviceStatus: "active" | "draft" | "paused" | "archived";
        status: "rejected" | "pending" | "approved" | "superseded" | "removed";
        enabled: boolean;
        reviewNote: null | string;
        reviewedAt: null | string;
        version: string;
      }>;
      lastReview: null | {
        event: "changes_requested" | "rejected" | "approved" | "submitted" | "withdrawn" | "reopened" | "items_reviewed";
        note: null | string;
        at: string;
      };
      availability: {
        online: boolean;
        activeVehicleId: null | string;
      };
    };
  };
  'GET /v1/partner/wallet': {
    response: {
      topupProviders: Array<"vnpay" | "mock">;
      balance: number;
      withdrawable: number;
      pendingWithdrawal: null | {
        id: string;
        amount: number;
      };
      minBalanceForOrders: number;
      canReceiveOrders: boolean;
    };
  };
  'GET /v1/partner/wallet/entries': {
    query?: {
      page?: number;
      pageSize?: number;
    };
    response: {
      items: Array<{
        id: string;
        amount: number;
        balanceAfter: number;
        type: "topup" | "order_hold" | "order_settle" | "order_refund" | "cancel_fee" | "withdrawal_request" | "withdrawal_paid" | "withdrawal_rejected" | "adjustment" | "affiliate_accrual" | "affiliate_payout" | "affiliate_forfeit" | "intercity_hold" | "intercity_refund" | "intercity_settle";
        description: string;
        transactionId: string;
        order: null | {
          id: string;
          code: string;
        };
        createdAt: string;
      }>;
      page: number;
      pageSize: number;
      total: number;
    };
  };
  /** Nạp ví (vd trả nợ hoa hồng đơn tiền mặt để được nhận đơn tiếp) */
  'POST /v1/partner/wallet/topups': {
    body: {
      amount: number;
      provider?: "vnpay" | "mock";
    };
    response: {
      id: string;
      reference: string;
      provider: "vnpay" | "mock";
      amount: number;
      status: string;
      expiresAt: string;
      paidAt: null | string;
      createdAt: string;
      paymentUrl: null | string;
    };
  };
  'GET /v1/partner/wallet/topups/:id': {
    params: { id: string };
    response: {
      id: string;
      reference: string;
      provider: "vnpay" | "mock";
      amount: number;
      status: string;
      expiresAt: string;
      paidAt: null | string;
      createdAt: string;
      paymentUrl: null | string;
    };
  };
  'GET /v1/partner/wallet/withdrawals': {
    query?: {
      page?: number;
      pageSize?: number;
    };
    response: {
      items: Array<{
        partner: {
          id: string;
          code: string;
          phone: string;
          fullName: string;
        };
        reviewedBy: null | {
          id: string;
          fullName: string;
        };
        id: string;
        amount: number;
        bankName: string;
        bankAccountNumber: string;
        bankAccountName: string;
        status: "rejected" | "paid" | "cancelled" | "pending";
        bankRef: null | string;
        note: null | string;
        reviewedAt: null | string;
        createdAt: string;
      }>;
      page: number;
      pageSize: number;
      total: number;
    };
  };
  'POST /v1/partner/wallet/withdrawals': {
    body: {
      amount: number;
      bankName: string;
      bankAccountNumber: string;
      bankAccountName: string;
    };
    response: {
      id: string;
      amount: number;
      bankName: string;
      bankAccountNumber: string;
      bankAccountName: string;
      status: "rejected" | "paid" | "cancelled" | "pending";
      bankRef: null | string;
      note: null | string;
      reviewedAt: null | string;
      createdAt: string;
    };
  };
  'POST /v1/partner/wallet/withdrawals/:id/cancel': {
    params: { id: string };
    response: {
      id: string;
      amount: number;
      bankName: string;
      bankAccountNumber: string;
      bankAccountName: string;
      status: "rejected" | "paid" | "cancelled" | "pending";
      bankRef: null | string;
      note: null | string;
      reviewedAt: null | string;
      createdAt: string;
    };
  };
  'GET /v1/public/affiliate/referral-check': {
    query: {
      tree: "customer" | "partner";
      code: string;
    };
    response: ({
      valid: false;
      code: string;
      displayName: null;
      full: boolean;
    }) | ({
      valid: true;
      code: string;
      displayName: string;
      full: boolean;
    });
  };
  'POST /v1/public/auth/refresh': {
    body: {
      refreshToken: string;
    };
    response: {
      accessToken: string;
      accessTokenExpiresAt: string;
      refreshToken: string;
      refreshTokenExpiresAt: string;
    };
  };
  'GET /v1/public/cancel-reasons': {
    query?: {
      actor?: "customer" | "partner";
      serviceId?: string;
    };
    response: Array<{
      id: string;
      label: string;
      serviceId: null | string;
      requiresProof: boolean;
    }>;
  };
  'GET /v1/public/catalog': {
    response: {
      categories: Array<{
        key: "delivery" | "transport" | "rental" | "bike" | "car" | "driver" | "intercity" | "handyman" | "labor";
        label: "Giao hàng" | "Vận tải" | "Dọn nhà" | "Xe máy" | "Xe hơi" | "Tài xế lái thay" | "Xe đường dài" | "Gọi thợ" | "Thuê nhân công";
        services: Array<{
          id: string;
          code: string;
          category: "delivery" | "transport" | "rental" | "bike" | "car" | "driver" | "intercity" | "handyman" | "labor";
          kind: "delivery" | "ride" | "driver_hire" | "moving" | "charter" | "on_site";
          name: string;
          shortDescription: null | string;
          description: null | string;
          imageUrl: null | string;
          vehicleType: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
          vehicleSeats: null | number;
          vehicleLoadKg: null | number;
          status: "active" | "paused";
          fromPrice: number;
          pricing: {
            basis: "fixed" | "distance" | "flat_per_stop" | "time_block";
            baseFare: number;
            includedDistanceMeters: number;
            perKmFare: number;
            blockMinutes: number;
          };
          rules: {
            operatingHours: null | Array<{
              days: number[];
              from: string;
              to: string;
            }>;
            allowScheduling: boolean;
            minScheduleLeadMinutes: number;
            maxScheduleDays: number;
            minStops: number;
            maxStops: number;
            allowReturnToPickup: boolean;
            allowCod: boolean;
            codMaxAmount: number;
          };
          addons: Array<{
            id: string;
            name: string;
            description: null | string;
            price: number;
            phase: "any" | "before_pickup" | "after_pickup";
          }>;
          weightTiers: Array<{
            id: string;
            label: string;
            maxWeightKg: null | number;
            surcharge: number;
          }>;
        }>;
      }>;
    };
  };
  'POST /v1/public/customer/auth/login/otp': {
    body: {
      verificationToken: string;
      deviceId?: string;
    };
    response: ({
      accessToken: string;
      accessTokenExpiresAt: string;
      refreshToken: string;
      refreshTokenExpiresAt: string;
    }) | ({
      needRegister: true;
    });
  };
  'POST /v1/public/customer/auth/login/passcode': {
    body: {
      phone: string;
      passcode: string;
      deviceId?: string;
    };
    response: {
      accessToken: string;
      accessTokenExpiresAt: string;
      refreshToken: string;
      refreshTokenExpiresAt: string;
    };
  };
  'POST /v1/public/customer/auth/otp/request': {
    body: {
      phone: string;
      purpose: "login" | "reset_passcode" | "change_phone";
    };
    response: {
      challengeId: string;
      expiresAt: string;
      resendAfter: string;
      debugCode?: string;
    };
  };
  'POST /v1/public/customer/auth/otp/verify': {
    body: {
      challengeId: string;
      code: string;
    };
    response: {
      verificationToken: string;
      expiresAt: string;
    };
  };
  'POST /v1/public/customer/auth/passcode/reset': {
    body: {
      verificationToken: string;
      newPasscode: string;
    };
    response: void;
  };
  'POST /v1/public/customer/auth/register': {
    body: {
      verificationToken: string;
      fullName: string;
      passcode: string;
      email?: string;
      referralCode?: string;
      deviceId?: string;
    };
    response: {
      accessToken: string;
      accessTokenExpiresAt: string;
      refreshToken: string;
      refreshTokenExpiresAt: string;
    };
  };
  'GET /v1/public/intercity/cities': {
    response: Array<{
      id: string;
      createdAt: string;
      updatedAt: string;
      name: string;
      status: "active" | "inactive";
      sortOrder: number;
      region: null | string;
      keywords: string[];
      stationName: string;
      stationAddress: string;
      stationLat: number;
      stationLng: number;
    }>;
  };
  /** Chuyến còn bán A → B trong ngày (giờ VN) */
  'GET /v1/public/intercity/trips': {
    query: {
      from: string;
      to: string;
      date: string;
      kind?: "bus" | "carpool";
    };
    response: Array<{
      seatsAvailable: number;
      id: string;
      kind: "bus" | "carpool";
      status: "scheduled" | "completed" | "cancelled" | "departed";
      operator: {
        id: string;
        code: string;
        name: string;
      };
      from: {
        id: string;
        name: string;
        station: string;
        address: string;
      };
      to: {
        id: string;
        name: string;
        station: string;
        address: string;
      };
      departAt: string;
      arriveAt: string;
      pricePerSeat: number;
      seatCount: number;
      amenities: string[];
      vehicle: {
        type: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        name: null | string;
        color: null | string;
        plate: null | string;
      };
      cargoFee: null | number;
      homePickupFee: null | number;
      homeDropoffFee: null | number;
      note: null | string;
    }>;
  };
  /** Chi tiết chuyến + sơ đồ ghế (taken = đã có người giữ / mua) */
  'GET /v1/public/intercity/trips/:id': {
    params: { id: string };
    response: {
      onSale: boolean;
      seats: Array<{
        taken: boolean;
        id: string;
        row: string;
        col: number;
        deck: number;
      }>;
      seatsAvailable: number;
      id: string;
      kind: "bus" | "carpool";
      status: "scheduled" | "completed" | "cancelled" | "departed";
      operator: {
        id: string;
        code: string;
        name: string;
      };
      from: {
        id: string;
        name: string;
        station: string;
        address: string;
      };
      to: {
        id: string;
        name: string;
        station: string;
        address: string;
      };
      departAt: string;
      arriveAt: string;
      pricePerSeat: number;
      seatCount: number;
      amenities: string[];
      vehicle: {
        type: "car" | "none" | "motorbike" | "van" | "truck" | "bus";
        name: null | string;
        color: null | string;
        plate: null | string;
      };
      cargoFee: null | number;
      homePickupFee: null | number;
      homeDropoffFee: null | number;
      note: null | string;
    };
  };
  'POST /v1/public/partner/auth/login/otp': {
    body: {
      verificationToken: string;
      deviceId?: string;
    };
    response: ({
      accessToken: string;
      accessTokenExpiresAt: string;
      refreshToken: string;
      refreshTokenExpiresAt: string;
    }) | ({
      needRegister: true;
    });
  };
  'POST /v1/public/partner/auth/login/passcode': {
    body: {
      phone: string;
      passcode: string;
      deviceId?: string;
    };
    response: {
      accessToken: string;
      accessTokenExpiresAt: string;
      refreshToken: string;
      refreshTokenExpiresAt: string;
    };
  };
  'POST /v1/public/partner/auth/otp/request': {
    body: {
      phone: string;
      purpose: "login" | "reset_passcode" | "change_phone";
    };
    response: {
      challengeId: string;
      expiresAt: string;
      resendAfter: string;
      debugCode?: string;
    };
  };
  'POST /v1/public/partner/auth/otp/verify': {
    body: {
      challengeId: string;
      code: string;
    };
    response: {
      verificationToken: string;
      expiresAt: string;
    };
  };
  'POST /v1/public/partner/auth/passcode/reset': {
    body: {
      verificationToken: string;
      newPasscode: string;
    };
    response: void;
  };
  'POST /v1/public/partner/auth/register': {
    body: {
      verificationToken: string;
      fullName: string;
      passcode: string;
      email?: string;
      referralCode?: string;
      deviceId?: string;
    };
    response: {
      accessToken: string;
      accessTokenExpiresAt: string;
      refreshToken: string;
      refreshTokenExpiresAt: string;
    };
  };
}

/** Sự kiện Socket.IO namespace `/customer` (bắt tay: `auth: { token: accessToken }`) */
export interface ZuumCustomerEvents {
  "order.updated": {
    orderId: string;
    status: "scheduled" | "searching" | "assigned" | "arrived_pickup" | "picked_up" | "completed" | "no_driver_found" | "cancelled";
  };
  "partner.location": {
    orderId: string;
    lat: number;
    lng: number;
    heading: null | number;
    at: string;
  };
  ready: {
    actor: "customer" | "partner";
    id: string;
  };
  auth_error: {
    code: string;
    message: string;
  };
  "notification.new": {
    id: string;
    type: "order" | "campaign" | "wallet" | "system" | "offer" | "partner_review";
    title: string;
  };
  "wallet.updated": {
    reason: string;
  };
}

/** Sự kiện Socket.IO namespace `/partner` (bắt tay: `auth: { token: accessToken }`) */
export interface ZuumPartnerEvents {
  "order.updated": {
    orderId: string;
    status: "scheduled" | "searching" | "assigned" | "arrived_pickup" | "picked_up" | "completed" | "no_driver_found" | "cancelled" | "released";
  };
  "offer.new": {
    offerId: string;
    orderId: string;
    expiresAt: string;
    expiresInSeconds: number;
  };
  "offer.withdrawn": {
    offerId: string;
    orderId: string;
  };
  "availability.changed": {
    online: false;
    reason: "gps_lost" | "not_eligible";
  };
  ready: {
    actor: "customer" | "partner";
    id: string;
  };
  auth_error: {
    code: string;
    message: string;
  };
  "notification.new": {
    id: string;
    type: "order" | "campaign" | "wallet" | "system" | "offer" | "partner_review";
    title: string;
  };
  "wallet.updated": {
    reason: string;
  };
}

export type ZuumRouteKey = keyof ZuumRoutes;
export type ZuumResponse<K extends ZuumRouteKey> = ZuumRoutes[K]['response'];
export type ZuumInput<K extends ZuumRouteKey> = Omit<ZuumRoutes[K], 'response'>;

/** Lỗi API: { error: { code, message, details? } } — `message` hiển thị được cho người dùng */
export class ZuumApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ZuumApiError';
  }
}

export interface ZuumClientOptions {
  /** vd https://api.zuumviet.vn (không có / cuối) */
  baseUrl: string;
  /** access token hiện tại (null = chưa đăng nhập) */
  getAccessToken?: () => string | null | undefined | Promise<string | null | undefined>;
  /** gọi khi API trả 401 trên route cần đăng nhập: làm mới token, trả true để thử lại đúng 1 lần */
  onUnauthorized?: () => Promise<boolean>;
  /** header thêm cho mọi request (vd x-device-id) */
  headers?: () => Record<string, string>;
  fetch?: typeof fetch;
}

function buildUrl(baseUrl: string, path: string, params?: Record<string, string>, query?: Record<string, unknown>): string {
  const filled = path.replace(/:([A-Za-z0-9_]+)/g, (_, name: string) => {
    const v = params?.[name];
    if (v === undefined) throw new Error(`Thiếu tham số :${name} cho ${path}`);
    return encodeURIComponent(v);
  });
  const qs: string[] = [];
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v === undefined || v === null || v === '') continue;
    for (const item of Array.isArray(v) ? v : [v]) qs.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(item))}`);
  }
  return `${baseUrl}${filled}${qs.length ? `?${qs.join('&')}` : ''}`;
}

export function createZuumClient(options: ZuumClientOptions) {
  const doFetch = options.fetch ?? fetch;
  async function send(route: string, input: { params?: Record<string, string>; query?: Record<string, unknown>; body?: unknown }, retried: boolean): Promise<unknown> {
    const space = route.indexOf(' ');
    const method = route.slice(0, space);
    const path = route.slice(space + 1);
    const isPublic = path.startsWith('/v1/public/');
    const token = isPublic ? null : await options.getAccessToken?.();
    const headers: Record<string, string> = { Accept: 'application/json', ...options.headers?.() };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (input.body !== undefined) headers['Content-Type'] = 'application/json';
    const res = await doFetch(buildUrl(options.baseUrl, path, input.params, input.query), {
      method,
      headers,
      body: input.body !== undefined ? JSON.stringify(input.body) : undefined,
    });
    if (res.status === 401 && !isPublic && !retried && options.onUnauthorized && (await options.onUnauthorized())) {
      return send(route, input, true);
    }
    if (res.status === 204) return undefined;
    const text = await res.text();
    const payload = text ? (JSON.parse(text) as unknown) : undefined;
    if (!res.ok) {
      const err = (payload as { error?: { code?: string; message?: string; details?: Record<string, string[]> } } | undefined)?.error;
      throw new ZuumApiError(res.status, err?.code ?? 'http_' + res.status, err?.message ?? 'Có lỗi xảy ra, vui lòng thử lại', err?.details);
    }
    return payload;
  }
  return {
    /** vd api.call('POST /v1/customer/intercity/trips/:id/holds', { params: { id }, body: { seatIds: ['A1'] } }) */
    call<K extends ZuumRouteKey>(route: K, ...args: {} extends ZuumInput<K> ? [input?: ZuumInput<K>] : [input: ZuumInput<K>]): Promise<ZuumResponse<K>> {
      return send(route, (args[0] ?? {}) as never, false) as Promise<ZuumResponse<K>>;
    },
  };
}
export type ZuumClient = ReturnType<typeof createZuumClient>;
