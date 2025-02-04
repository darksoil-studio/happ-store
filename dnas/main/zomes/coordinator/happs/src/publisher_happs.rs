use happs_integrity::*;
use hdk::prelude::*;

#[hdk_extern]
pub fn get_publisher_happs(author: AgentPubKey) -> ExternResult<Vec<Link>> {
    get_links(GetLinksInputBuilder::try_new(author, LinkTypes::PublisherHapps)?.build())
}
