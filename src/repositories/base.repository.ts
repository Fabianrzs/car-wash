type CrudDelegate = {
  findMany: (...args: never[]) => unknown;
  findFirst: (...args: never[]) => unknown;
  create: (...args: never[]) => unknown;
  update: (...args: never[]) => unknown;
  delete: (...args: never[]) => unknown;
  count: (...args: never[]) => unknown;
};

export class BaseRepository<TDelegate extends CrudDelegate> {
  constructor(protected readonly model: TDelegate) {}

  findMany(...args: Parameters<TDelegate["findMany"]>): ReturnType<TDelegate["findMany"]> {
    return this.model.findMany(...args) as ReturnType<TDelegate["findMany"]>;
  }

  findFirst(...args: Parameters<TDelegate["findFirst"]>): ReturnType<TDelegate["findFirst"]> {
    return this.model.findFirst(...args) as ReturnType<TDelegate["findFirst"]>;
  }

  create(...args: Parameters<TDelegate["create"]>): ReturnType<TDelegate["create"]> {
    return this.model.create(...args) as ReturnType<TDelegate["create"]>;
  }

  update(...args: Parameters<TDelegate["update"]>): ReturnType<TDelegate["update"]> {
    return this.model.update(...args) as ReturnType<TDelegate["update"]>;
  }

  delete(...args: Parameters<TDelegate["delete"]>): ReturnType<TDelegate["delete"]> {
    return this.model.delete(...args) as ReturnType<TDelegate["delete"]>;
  }

  count(...args: Parameters<TDelegate["count"]>): ReturnType<TDelegate["count"]> {
    return this.model.count(...args) as ReturnType<TDelegate["count"]>;
  }
}

