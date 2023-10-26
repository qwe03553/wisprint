<%@ page import="java.util.Date"%>
<%@ page language="java" pageEncoding="UTF-8" contentType="text/html;charset=UTF-8"%>
<%
	String digest = "unknown";	
	String salt = request.getParameter("salt");
	if(salt != null && salt.length() >= 16) 
	{
		 try {
				String today = new java.text.SimpleDateFormat("yyyyMMdd").format(new Date());
		        java.security.MessageDigest md = java.security.MessageDigest.getInstance("MD5");
		        md.update(("1c9d57e944a83a5f44303d24f109f294"+salt+today).getBytes());
				StringBuffer hexString = new StringBuffer();
				byte[] hash = md.digest();
				for (int i = 0; i < hash.length; i++) {
					if ((0xff & hash[i]) < 0x10) {
						hexString.append("0" + Integer.toHexString((0xFF & hash[i])));
					} else {
						hexString.append(Integer.toHexString(0xFF & hash[i]));
					}
				}				
				digest = hexString.toString();
		    } catch (Exception e) {
		    }
	}
%>{
   "copyrights" : "本软件已依法授权给摩尔元素(厦门)科技有限公司, 其他单位和个人禁止使用, 违者必究.杰创软件拥有版权 www.jatools.com",
   "key" : "LIC_HERE:kYWRjOTFiMMWUwMDFlNTEwMTU5MDYwZDdlMDk1MjU4NDYyNDBkMDE1MTVjNjU1YzA0NWNjOWIzZGU4MTVkZmFhZWQxOWViZmNlMjYxYTBkMDA1MmRlZDJiYmMzZDQ5YmJlYmRiZGVjZGRjOWJlYjVhN2M0Y2JkNmFjYzNkYTk3YmI4NmExYjk1Y2EwYWNhZmI2MDdkN2EzZDBkMGJjZmNhNWJmY2RjNGE0ZDI1ZjBlYWU4MWE3OTdkYTg5YTRkYWNlYTJkNzlhYmJlNWQ1OWViYWQ1YTU5NWI5YTI1ODRmYTFjOWE2ZjFkOWJkZDJkMzQxOTFiNmQ1YzBhNzgyZDA4ZGZkZGRiNmJjZGM4OWU0YzI0MTAzMTgxODQyMTk0ZjFjMGEwMzAwMWMwMjA5MGUxOTY1MGIxZjRlMWY1ZjU3NDI1ZDU5MDI1YjUxNWE1ZTU2NTQ1ZjE5NTM=",
   "digest" :"<%=digest%>"
}

