import { HandlerTools } from '@iote/cqrs';
import { FunctionContext, FunctionHandler } from '@ngfi/functions';

import { Organisation } from '@app/model/organisation';
import { iTalUser } from '@app/model/user';

import { defaultPermissions } from './default-permissions';

export class OrganisationAssignUserHandler extends FunctionHandler<Organisation, boolean>
{

  public async execute(org: Organisation, context: FunctionContext, tools: HandlerTools) {

    const orgsRepo = tools.getRepository<any>(`orgs`);
    const userRepo = tools.getRepository<any>(`users`);

    const perRepo = tools.getRepository<any>(`orgs/${org.id}/config`);

    if (!!org.createdBy) {
      try {
        const activeOrg = {
          id: org.id,
          logoUrl: '',
          name: org.name,
          users: [org.createdBy],
          address: org.address,
          roles: ['admin', 'junior', 'senior', 'intern'],
          permissions: {}
        } as Organisation;

        orgsRepo.update(activeOrg);

        perRepo.write(defaultPermissions, 'permissions');

        let adminUser: iTalUser = await userRepo.getDocumentById(org.createdBy);
        let adminRight = {
          admin: true,
          junior: false,
          senior: false,
          intern: false
        };

        adminUser.roles[org.id!] = adminRight;
        adminUser.activeOrg = org.id!;

        if (!adminUser.orgs) {
          adminUser.orgs = [];
        }
        
        adminUser.orgs.push(org.id!);

        userRepo.write(adminUser, org.createdBy)

        return true;

      } catch (err) {
        tools.Logger.log(() => `Error updating ${err}`)
        return false;
      }
    } else {
      return false
    }
  }
}